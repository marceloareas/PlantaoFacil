from validators.turnosConsecutivos import verificar_turnos_consecutivos
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from core.dependencies import get_setor_id, require_coordenador
from database import get_db
from models.escalaDiaModels import Escala
from schemas.escalaDiaSchemas import EscalaDiaCreate
from services.limitesService import avisos_para
from services.periodoService import FORMATO_ESCALA, tipo_novo_plantao
from datetime import datetime

router = APIRouter(prefix="/escaladodia", tags=["Escala do Dia"])


def verificar_escalado_em_outro_setor(db: Session, data: str, item, setor_id: int):
    conflito = db.query(Escala).filter(
        Escala.DataEscala == data,
        Escala.Horario == item.Horario,
        Escala.Cpf == item.Cpf,
        Escala.setor_id != setor_id,
    ).first()

    if conflito:
        raise HTTPException(
            status_code=400,
            detail=f"{item.Nome} já está escalado no turno {item.Horario} do setor {conflito.setor.nome}",
        )


def ler_data_da_escala(data: str) -> datetime:
    try:
        return datetime.strptime(data, FORMATO_ESCALA)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida, use o formato DD-MM-AAAA")


def serializar_linha(e: Escala) -> dict:
    return {
        "Horario": e.Horario,
        "Nome": e.Nome,
        "Cargo": e.Cargo,
        "Cpf": e.Cpf,
        "Tipo": e.tipo or "regular",
    }


def criar_linhas(db: Session, data: str, data_dt: datetime, escala_dia: EscalaDiaCreate, setor_id: int, tipos_existentes: dict) -> list:
    """Cria as linhas recebidas; quem já estava no turno mantém o tipo, quem entrou agora recebe o tipo de plantão novo."""
    tipo_novo = None
    novas_escalas = []

    for item in escala_dia.Escala:

        verificacao = verificar_turnos_consecutivos(
            db,
            item.Cpf,
            data_dt,
            item.Horario
        )

        if verificacao:
            raise HTTPException(
                status_code=400,
                detail=f"Devido a 3 turnos seguidos do usuário {item.Nome}, a alocação foi bloqueada"
            )

        verificar_escalado_em_outro_setor(db, data, item, setor_id)

        tipo = tipos_existentes.get((item.Cpf, item.Horario))
        if tipo is None:
            if tipo_novo is None:
                tipo_novo = tipo_novo_plantao(db, setor_id, data_dt.date())
            tipo = tipo_novo

        nova_escala = Escala(
            DataEscala=data,
            Horario=item.Horario,
            Nome=item.Nome,
            Cargo=item.Cargo,
            Cpf=item.Cpf,
            setor_id=setor_id,
            tipo=tipo
        )
        db.add(nova_escala)
        novas_escalas.append(nova_escala)
        db.flush()  # Garante que o novo registro seja processado antes da próxima iteração

    return novas_escalas


def resposta_com_avisos(db: Session, mensagem: str, data: str, data_dt: datetime, linhas: list, setor_id: int) -> dict:
    return {
        "message": mensagem,
        "DataEscala": data,
        "Escala": linhas,
        "avisos": avisos_para(db, setor_id, {linha["Cpf"] for linha in linhas}, data_dt.date()),
    }


@router.post("/{data}", dependencies=[Depends(require_coordenador)])
def create_escala_do_dia(data: str, escala_dia: EscalaDiaCreate, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    data_dt = ler_data_da_escala(data)
    try:
        existentes = db.query(Escala).filter(Escala.DataEscala == data, Escala.setor_id == setor_id).all()
        tipos_existentes = {(e.Cpf, e.Horario): e.tipo for e in existentes}

        escalas_criadas = criar_linhas(db, data, data_dt, escala_dia, setor_id, tipos_existentes)
        linhas = [serializar_linha(e) for e in escalas_criadas]
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    return resposta_com_avisos(db, "Escala criada com sucesso", data, data_dt, linhas, setor_id)

@router.get("/{data}")
def get_escala_do_dia(data: str, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    escalas = db.query(Escala).filter(Escala.DataEscala == data, Escala.setor_id == setor_id).all()

    if not escalas:
        raise HTTPException(status_code=404, detail="Nenhuma escala encontrada para essa data")

    resultado = [serializar_linha(e) for e in escalas]

    return {
        "DataEscala": data,
        "Escala": resultado
    }

@router.put("/{data}", dependencies=[Depends(require_coordenador)])
def update_escala_do_dia(data: str, escala_dia: EscalaDiaCreate, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    data_dt = ler_data_da_escala(data)
    escalas_antigas = db.query(Escala).filter(Escala.DataEscala == data, Escala.setor_id == setor_id).all()
    # o tipo (regular/extra) de quem continua no turno não muda ao salvar
    tipos_existentes = {(e.Cpf, e.Horario): e.tipo for e in escalas_antigas}

    try:

        if escalas_antigas:
            for e in escalas_antigas:

                db.delete(e)
            db.flush()

        novas_escalas = criar_linhas(db, data, data_dt, escala_dia, setor_id, tipos_existentes)
        linhas = [serializar_linha(e) for e in novas_escalas]
        db.commit()

    except Exception as e:
        db.rollback()
        raise e

    return resposta_com_avisos(db, "Escala atualizada com sucesso", data, data_dt, linhas, setor_id)
