from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from core.perfis import is_cargo_gestao
from models.escalaDiaModels import Escala
from models.funcAusentesModels import Ausentes
from models.periodoModels import Periodo
from models.userModels import User
from services.periodoService import DIAS_DO_CICLO, TURNOS, agora, data_para_escala, ler_data, serializar_periodo
from validators.turnosConsecutivos import verificar_turnos_consecutivos


def dias_de_trabalho(inicio_ciclo: date, dias_do_ciclo: int, inicio: date, fim: date) -> list[date]:
    """Datas entre inicio e fim (inclusive) que caem no ciclo iniciado em inicio_ciclo."""
    dias = []
    dia = inicio
    while dia <= fim:
        if dia >= inicio_ciclo and (dia - inicio_ciclo).days % dias_do_ciclo == 0:
            dias.append(dia)
        dia += timedelta(days=1)
    return dias


def _indice_turno(horario: str | None) -> int:
    return TURNOS.index(horario) if horario in TURNOS else -1


def turno_bloqueado_por_ausencia(dia: date, turno: str, ausencia) -> bool:
    """Mesma regra do isTurnoBlockedByAusencia do frontend (EditarEscala)."""
    inicio = ausencia.data
    fim = ausencia.data_final or ausencia.data

    if dia < inicio or dia > fim:
        return False

    idx_turno = _indice_turno(turno)
    idx_inicio = _indice_turno(ausencia.horario)
    idx_fim = _indice_turno(ausencia.horario_final or ausencia.horario)

    if dia == inicio and dia == fim:
        return idx_inicio <= idx_turno <= idx_fim
    if dia == inicio:
        return idx_turno >= idx_inicio
    if dia == fim:
        return idx_turno <= idx_fim
    return True


def _motivo_sem_configuracao(user: User) -> str | None:
    if not user.turno or not user.inicio_ciclo:
        return "Turno ou início do ciclo não definido no cadastro"
    if user.turno not in TURNOS:
        return f"Turno não reconhecido: {user.turno}"
    if (user.horaEscala or "").lower() not in DIAS_DO_CICLO:
        return f"Regime de escala desconhecido: {user.horaEscala}"
    return None


def _ausencias_por_cpf(db: Session, cpfs: list[str], periodo: Periodo) -> dict[str, list]:
    if not cpfs:
        return {}
    ausencias = (
        db.query(Ausentes)
        .filter(
            Ausentes.cpf.in_(cpfs),
            Ausentes.ausente == "Sim",
            Ausentes.data <= periodo.data_fim,
        )
        .all()
    )
    por_cpf: dict[str, list] = {}
    for ausencia in ausencias:
        por_cpf.setdefault(ausencia.cpf, []).append(ausencia)
    return por_cpf


def _motivo_para_ignorar(db: Session, user: User, dia: date, data_str: str, setor_id: int, ausencias: list) -> str | None:
    conflito = db.query(Escala).filter(
        Escala.DataEscala == data_str,
        Escala.Horario == user.turno,
        Escala.Cpf == user.cpf,
        Escala.setor_id != setor_id,
    ).first()
    if conflito:
        nome_setor = conflito.setor.nome if conflito.setor else "outro setor"
        return f"Já está escalado neste turno no setor {nome_setor}"

    for ausencia in ausencias:
        if turno_bloqueado_por_ausencia(dia, user.turno, ausencia):
            return f"Ausência registrada ({ausencia.motivo})"

    nova_data = datetime.combine(dia, datetime.min.time())
    if verificar_turnos_consecutivos(db, user.cpf, nova_data, user.turno):
        return "Ficaria com 3 turnos seguidos"

    return None


def _cpfs_com_plantao_regular_no_periodo(db: Session, periodo: Periodo) -> set[str]:
    linhas = (
        db.query(Escala.Cpf, Escala.DataEscala)
        .filter(Escala.setor_id == periodo.setor_id, Escala.tipo == "regular")
        .all()
    )
    cpfs = set()
    for cpf, data_str in linhas:
        try:
            data = ler_data(data_str)
        except ValueError:
            continue
        if periodo.data_inicio <= data <= periodo.data_fim:
            cpfs.add(cpf)
    return cpfs


def gerar_escala_do_periodo(db: Session, periodo: Periodo) -> dict:
    """Aloca os funcionários ativos do setor nos seus dias de trabalho."""
    setor_id = periodo.setor_id
    usuarios = (
        db.query(User)
        .filter(User.setor_id == setor_id)
        .order_by(User.nome_completo)
        .all()
    )
    funcionarios = [
        u for u in usuarios
        if not is_cargo_gestao(u.cargo) and (u.situacao or "").strip().lower() == "ativo"
    ]

    sem_configuracao, configurados = [], []
    for user in funcionarios:
        motivo = _motivo_sem_configuracao(user)
        if motivo:
            sem_configuracao.append({"cpf": user.cpf, "nome": user.nome_completo, "motivo": motivo})
        else:
            configurados.append(user)

    ausencias = _ausencias_por_cpf(db, [u.cpf for u in configurados], periodo)

    # Depois da primeira geração, só entra quem ainda não tem plantão regular no período
    # (ex.: funcionário novo). Assim os plantões que o gestor tirou à mão não voltam.
    ja_no_periodo = _cpfs_com_plantao_regular_no_periodo(db, periodo) if periodo.escala_gerada_em else set()

    criados = 0
    resumo, ignorados = [], []
    for user in configurados:
        plantoes = 0
        if user.cpf in ja_no_periodo:
            resumo.append({"cpf": user.cpf, "nome": user.nome_completo, "plantoes": plantoes})
            continue
        ciclo = DIAS_DO_CICLO[user.horaEscala.lower()]
        for dia in dias_de_trabalho(user.inicio_ciclo, ciclo, periodo.data_inicio, periodo.data_fim):
            data_str = data_para_escala(dia)

            ja_escalado = db.query(Escala).filter(
                Escala.DataEscala == data_str,
                Escala.Horario == user.turno,
                Escala.Cpf == user.cpf,
                Escala.setor_id == setor_id,
            ).first()
            if ja_escalado:
                continue

            motivo = _motivo_para_ignorar(db, user, dia, data_str, setor_id, ausencias.get(user.cpf, []))
            if motivo:
                ignorados.append({
                    "cpf": user.cpf,
                    "nome": user.nome_completo,
                    "data": data_str,
                    "horario": user.turno,
                    "motivo": motivo,
                })
                continue

            db.add(Escala(
                DataEscala=data_str,
                Horario=user.turno,
                Nome=user.nome_completo,
                Cargo=user.cargo,
                Cpf=user.cpf,
                setor_id=setor_id,
                tipo="regular",
            ))
            # a sessão não usa autoflush: sem isso as próximas checagens não veem a linha nova
            db.flush()
            plantoes += 1

        criados += plantoes
        resumo.append({"cpf": user.cpf, "nome": user.nome_completo, "plantoes": plantoes})

    # sem ninguém configurado nada foi gerado de fato; o período continua editável e excluível
    if configurados and not periodo.escala_gerada_em:
        periodo.escala_gerada_em = agora()
    db.commit()
    db.refresh(periodo)

    return {
        "periodo": serializar_periodo(periodo),
        "criados": criados,
        "funcionarios": resumo,
        "ignorados": ignorados,
        "sem_configuracao": sem_configuracao,
    }
