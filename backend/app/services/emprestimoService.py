from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.perfis import is_cargo_gestao
from models.emprestimoModels import Emprestimo
from models.escalaDiaModels import Escala
from models.funcAusentesModels import Ausentes
from models.setorModels import Setor
from models.userModels import User
from services.escalaPeriodoService import dias_de_trabalho, turno_bloqueado_por_ausencia
from services.periodoService import DIAS_DO_CICLO, TURNOS, agora, data_para_escala, ler_data
from validators.turnosConsecutivos import verificar_turnos_consecutivos


def _formatar(data: date) -> str:
    return data.strftime("%d/%m/%Y")


def _nome_setor(setor: Setor | None) -> str:
    return setor.nome if setor else "outro setor"


def emprestimo_no_dia(db: Session, cpf: str, dia: date) -> Emprestimo | None:
    """Empréstimo por intervalo do funcionário que cobre o dia, se houver."""
    return (
        db.query(Emprestimo)
        .filter(
            Emprestimo.cpf == cpf,
            Emprestimo.data_inicio <= dia,
            Emprestimo.data_fim >= dia,
        )
        .first()
    )


def emprestimos_do_setor_no_dia(db: Session, setor_id: int, dia: date) -> tuple[list[Emprestimo], list[Emprestimo]]:
    """(saindo do setor, entrando no setor) no dia."""
    ativos = (
        db.query(Emprestimo)
        .filter(Emprestimo.data_inicio <= dia, Emprestimo.data_fim >= dia)
        .all()
    )
    saindo = [e for e in ativos if e.setor_origem_id == setor_id]
    entrando = [e for e in ativos if e.setor_destino_id == setor_id]
    return saindo, entrando


def _escalado_no_proprio_setor(db: Session, user: User, data_str: str) -> bool:
    return db.query(Escala).filter(
        Escala.Cpf == user.cpf,
        Escala.DataEscala == data_str,
        Escala.setor_id == user.setor_id,
    ).first() is not None


def verificar_entrada_na_escala(db: Session, user: User | None, setor_id: int, data_str: str, dia: date) -> bool:
    """Confere se o funcionário pode entrar na escala do setor no dia.

    Devolve True quando é um empréstimo de um único plantão (o plantão conta como extra).
    """
    if user is None or user.setor_id is None:
        return False

    emprestimo = emprestimo_no_dia(db, user.cpf, dia)

    if emprestimo:
        if emprestimo.setor_destino_id == setor_id:
            # emprestado a este setor no intervalo: entra como se fosse do setor
            return False
        raise HTTPException(
            status_code=400,
            detail=(
                f"{user.nome_completo} está emprestado ao setor {_nome_setor(emprestimo.setor_destino)} "
                f"de {_formatar(emprestimo.data_inicio)} a {_formatar(emprestimo.data_fim)}"
            ),
        )

    if user.setor_id == setor_id:
        return False

    # empréstimo de um único plantão: só se ele não estiver na escala do próprio setor nesse dia
    if _escalado_no_proprio_setor(db, user, data_str):
        raise HTTPException(
            status_code=400,
            detail=(
                f"{user.nome_completo} está na escala do próprio setor ({_nome_setor(user.setor)}) "
                f"em {_formatar(dia)} e não pode ser emprestado nesse dia"
            ),
        )
    return True


def funcionarios_emprestaveis(db: Session, setor_id: int, dia: date) -> list[User]:
    """Funcionários de outros setores que podem cobrir um plantão deste setor no dia."""
    data_str = data_para_escala(dia)
    candidatos = (
        db.query(User)
        .filter(User.setor_id.isnot(None), User.setor_id != setor_id)
        .order_by(User.nome_completo)
        .all()
    )
    disponiveis = []
    for user in candidatos:
        if is_cargo_gestao(user.cargo) or (user.situacao or "").strip().lower() != "ativo":
            continue
        if emprestimo_no_dia(db, user.cpf, dia):
            continue
        if _escalado_no_proprio_setor(db, user, data_str):
            continue
        disponiveis.append(user)
    return disponiveis


def _linhas_do_funcionario_entre(db: Session, cpf: str, inicio: date, fim: date, setor_id: int | None = None) -> list[Escala]:
    query = db.query(Escala).filter(Escala.Cpf == cpf)
    if setor_id is not None:
        query = query.filter(Escala.setor_id == setor_id)
    linhas = []
    for linha in query.all():
        try:
            dia = ler_data(linha.DataEscala)
        except ValueError:
            continue
        if inicio <= dia <= fim:
            linhas.append(linha)
    return linhas


def serializar_emprestimo(emprestimo: Emprestimo) -> dict:
    return {
        "id": emprestimo.id,
        "cpf": emprestimo.cpf,
        "nome": emprestimo.user.nome_completo if emprestimo.user else emprestimo.cpf,
        "setor_origem_id": emprestimo.setor_origem_id,
        "setor_origem": _nome_setor(emprestimo.setor_origem),
        "setor_destino_id": emprestimo.setor_destino_id,
        "setor_destino": _nome_setor(emprestimo.setor_destino),
        "data_inicio": emprestimo.data_inicio.isoformat(),
        "data_fim": emprestimo.data_fim.isoformat(),
        "turno": emprestimo.turno,
        "primeiro_dia": emprestimo.primeiro_dia.isoformat(),
        "criado_por": emprestimo.criado_por.nome_completo if emprestimo.criado_por else None,
        "criado_em": emprestimo.criado_em.isoformat() if emprestimo.criado_em else None,
    }


def criar_emprestimo_por_intervalo(db: Session, payload, criado_por: User) -> dict:
    user = db.query(User).filter(User.cpf == payload.cpf).first()
    if not user or is_cargo_gestao(user.cargo):
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    if (user.situacao or "").strip().lower() != "ativo":
        raise HTTPException(status_code=400, detail=f"{user.nome_completo} está desativado")
    if user.setor_id is None:
        raise HTTPException(status_code=400, detail="Funcionário sem setor definido")

    destino = db.get(Setor, payload.setor_destino_id)
    if not destino:
        raise HTTPException(status_code=404, detail="Setor de destino não encontrado")
    if destino.id == user.setor_id:
        raise HTTPException(status_code=400, detail="O setor de destino deve ser diferente do setor do funcionário")

    ciclo = DIAS_DO_CICLO.get((user.horaEscala or "").lower())
    if not ciclo:
        raise HTTPException(status_code=400, detail=f"Regime de escala desconhecido: {user.horaEscala}")
    if payload.turno not in TURNOS:
        raise HTTPException(status_code=400, detail=f"Turno deve ser '{TURNOS[0]}' ou '{TURNOS[1]}'")

    inicio, fim = payload.data_inicio, payload.data_fim
    primeiro_dia = payload.primeiro_dia or inicio
    if inicio > fim:
        raise HTTPException(status_code=400, detail="A data de início não pode ser posterior à data de fim")
    if not inicio <= primeiro_dia <= fim:
        raise HTTPException(status_code=400, detail="O primeiro dia de trabalho deve estar dentro do empréstimo")

    sobreposto = (
        db.query(Emprestimo)
        .filter(
            Emprestimo.cpf == user.cpf,
            Emprestimo.data_inicio <= fim,
            Emprestimo.data_fim >= inicio,
        )
        .first()
    )
    if sobreposto:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{user.nome_completo} já está emprestado ao setor {_nome_setor(sobreposto.setor_destino)} "
                f"de {_formatar(sobreposto.data_inicio)} a {_formatar(sobreposto.data_fim)}"
            ),
        )

    nome_setor_origem = _nome_setor(user.setor)

    # 1) sai da escala do próprio setor durante o empréstimo
    removidos = []
    for linha in _linhas_do_funcionario_entre(db, user.cpf, inicio, fim, user.setor_id):
        removidos.append({"data": linha.DataEscala, "horario": linha.Horario})
        db.delete(linha)
    db.flush()

    # 2) plantões feitos em dias que, pelo novo ciclo, seriam de descanso passam a contar como extra
    #    (ex.: 12x36 com plantão na véspera do primeiro dia no outro setor)
    viraram_extra = []
    inicio_descanso = primeiro_dia - timedelta(days=ciclo - 1)
    fim_descanso = primeiro_dia - timedelta(days=1)
    if inicio_descanso <= fim_descanso:
        for linha in _linhas_do_funcionario_entre(db, user.cpf, inicio_descanso, fim_descanso):
            if linha.tipo != "extra":
                linha.tipo = "extra"
                viraram_extra.append({"data": linha.DataEscala, "horario": linha.Horario})

    # 3) entra na escala do setor de destino seguindo o regime a partir do primeiro dia
    ausencias = (
        db.query(Ausentes)
        .filter(Ausentes.cpf == user.cpf, Ausentes.ausente == "Sim", Ausentes.data <= fim)
        .all()
    )
    criados, ignorados = 0, []
    for dia in dias_de_trabalho(primeiro_dia, ciclo, primeiro_dia, fim):
        data_str = data_para_escala(dia)

        ja_escalado = db.query(Escala).filter(
            Escala.DataEscala == data_str,
            Escala.Horario == payload.turno,
            Escala.Cpf == user.cpf,
            Escala.setor_id == destino.id,
        ).first()
        if ja_escalado:
            continue

        motivo = None
        conflito = db.query(Escala).filter(
            Escala.DataEscala == data_str,
            Escala.Horario == payload.turno,
            Escala.Cpf == user.cpf,
            Escala.setor_id != destino.id,
        ).first()
        if conflito:
            motivo = f"Já está escalado neste turno no setor {_nome_setor(conflito.setor)}"
        elif any(turno_bloqueado_por_ausencia(dia, payload.turno, a) for a in ausencias):
            motivo = "Ausência registrada"
        elif verificar_turnos_consecutivos(db, user.cpf, datetime.combine(dia, datetime.min.time()), payload.turno):
            motivo = "Ficaria com 3 turnos seguidos"

        if motivo:
            ignorados.append({"data": data_str, "horario": payload.turno, "motivo": motivo})
            continue

        db.add(Escala(
            DataEscala=data_str,
            Horario=payload.turno,
            Nome=user.nome_completo,
            Cargo=user.cargo,
            Cpf=user.cpf,
            setor_id=destino.id,
            # substitui os plantões normais dele no setor de origem
            tipo="regular",
        ))
        db.flush()
        criados += 1

    emprestimo = Emprestimo(
        cpf=user.cpf,
        setor_origem_id=user.setor_id,
        setor_destino_id=destino.id,
        data_inicio=inicio,
        data_fim=fim,
        turno=payload.turno,
        primeiro_dia=primeiro_dia,
        criado_por_id=criado_por.id,
        criado_em=agora(),
    )
    db.add(emprestimo)
    db.commit()
    db.refresh(emprestimo)

    return {
        "emprestimo": serializar_emprestimo(emprestimo),
        "removidos_origem": removidos,
        "criados_destino": criados,
        "viraram_extra": viraram_extra,
        "ignorados": ignorados,
        "setor_origem": nome_setor_origem,
    }
