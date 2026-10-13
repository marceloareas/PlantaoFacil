from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from core.dependencies import require_coordenador
from database import get_db
from models.escalaDiaModels import Escala
from models.userModels import User
from schemas.escalaLoteSchemas import EscalaLoteSchemas
from services.limitesService import avisos_para
from services.periodoService import DIAS_DO_CICLO, periodo_da_data, tipo_novo_plantao
from fastapi import HTTPException
from datetime import datetime, timedelta
from validators.turnosConsecutivos import verificar_turnos_consecutivos

router = APIRouter(prefix="/escalaLote", tags=["Escala em Lote"])


@router.post("/", dependencies=[Depends(require_coordenador)])
def criar_lote(dados: EscalaLoteSchemas, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == dados.usuario_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user.setor_id is None:
        raise HTTPException(status_code=400, detail="Funcionário sem setor definido")

    try:
        data_atual = datetime.strptime(dados.data_inicio, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inicial inválida")

    # 12x36: para cada dia alocado, pula 2 dias; 12x60: pula 3 dias
    pulo = DIAS_DO_CICLO.get((user.horaEscala or "").lower(), 1)


    datas_validas = []

    for _ in range(dados.quantidade_dias):

        data_formatada = data_atual.strftime("%d-%m-%Y")

        #VERIFICA SE USUÁRIO JÁ ESTÁ NO DIA (QUALQUER TURNO)
        existe_usuario = db.query(Escala).filter(
            Escala.DataEscala == data_formatada,
            Escala.Horario == dados.horario,
            Escala.Cpf == user.cpf
        ).first()

        if existe_usuario:
            pass

        else:

            DiasConsecutivos = verificar_turnos_consecutivos(
            db,
            user.cpf,
            data_atual,
            dados.horario
        )
            if DiasConsecutivos:
                raise HTTPException(status_code=400, detail=f"Alocação bloqueada para {data_formatada} devido a 3 turnos seguidos")

            # depois de gerada a escala do período, o plantão conta como extra
            tipo = tipo_novo_plantao(db, user.setor_id, data_atual.date())
            datas_validas.append((data_formatada, data_atual.date(), tipo))

        data_atual += timedelta(days=pulo)

    for data, _, tipo in datas_validas:
        nova_escala = Escala(
            Cpf=user.cpf,
            Nome=user.nome_completo,
            Cargo=user.cargo,
            DataEscala=data,
            Horario=dados.horario,
            setor_id=user.setor_id,
            tipo=tipo
        )
        db.add(nova_escala)

    db.commit()

    # um lote pode atravessar mais de um período
    avisos, periodos_vistos = [], set()
    for _, dia, _ in datas_validas:
        periodo = periodo_da_data(db, user.setor_id, dia)
        if periodo and periodo.id not in periodos_vistos:
            periodos_vistos.add(periodo.id)
            avisos.extend(avisos_para(db, user.setor_id, [user.cpf], dia))

    return {
        "message": "Processo finalizado",
        "avisos": avisos,
    }
