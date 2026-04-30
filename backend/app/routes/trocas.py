from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.trocasModels import Troca
from schemas.trocasSchemas import TrocaCreate, TrocaResponse, TrocaUpdate
from typing import List
from models.escalaDiaModels import Escala
from datetime import datetime

router = APIRouter(prefix="/trocas", tags=["Trocas"])


def converter_data(data_iso: str) -> str:
    try:
        return datetime.strptime(data_iso, "%Y-%m-%d").strftime("%d-%m-%Y")
    except:
        return data_iso 


@router.post("/", response_model=TrocaResponse)
def criar_troca(troca: TrocaCreate, db: Session = Depends(get_db)):
    nova_troca = Troca(
        solicitante=troca.solicitante,
        destinatario=troca.destinatario,
        meudia=troca.meudia,
        horariosolicitante=troca.horariosolicitante,
        diacolega=troca.diacolega,
        horariodestinatario=troca.horariodestinatario,
        motivo=troca.motivo,
        situacao=troca.situacao or "Aguardando Destinatario"
    )
    db.add(nova_troca)
    db.commit()
    db.refresh(nova_troca)
    return nova_troca


@router.put("/{troca_id}", response_model=TrocaResponse)
def editar_troca(troca_id: int, dados: TrocaUpdate, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao not in ["Pendente", "Aguardando Destinatario"]:
        raise HTTPException(
            status_code=400,
            detail="Só é possível editar trocas em situação Pendente ou Aguardando Destinatario"
        )

    troca.destinatario = dados.destinatario
    troca.meudia = dados.meudia
    troca.horariosolicitante = dados.horariosolicitante
    troca.diacolega = dados.diacolega
    troca.horariodestinatario = dados.horariodestinatario
    troca.motivo = dados.motivo

    troca.situacao = "Aguardando Destinatario"

    db.commit()
    db.refresh(troca)

    return troca


@router.put("/{troca_id}/destinatario-aprovar", response_model=TrocaResponse)
def destinatario_aprovar(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aguardando Destinatario":
        raise HTTPException(status_code=400, detail="Troca não está aguardando o destinatário")

    troca.situacao = "Pendente"
    db.commit()
    db.refresh(troca)
    return troca


@router.put("/{troca_id}/destinatario-rejeitar", response_model=TrocaResponse)
def destinatario_rejeitar(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aguardando Destinatario":
        raise HTTPException(status_code=400, detail="Troca não está aguardando o destinatário")

    troca.situacao = "Rejeitada Pelo Destinatario"
    db.commit()
    db.refresh(troca)
    return troca


@router.get("/", response_model=List[TrocaResponse])
def listar_trocas(solicitante: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Troca)
    if solicitante:
        query = query.filter(Troca.solicitante == solicitante)
    return query.order_by(Troca.id.desc()).all()


@router.put("/{troca_id}/aprovar", response_model=TrocaResponse)
def aprovar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao not in ["Pendente", "Desfeita"]:
        raise HTTPException(status_code=400, detail="Esta troca já foi finalizada")

    data_solicitante = converter_data(troca.meudia)
    data_destinatario = converter_data(troca.diacolega)

    escala_solicitante = db.query(Escala).filter(
        Escala.DataEscala == data_solicitante,
        Escala.Horario == troca.horariosolicitante
    ).first()

    if not escala_solicitante:
        raise HTTPException(status_code=404, detail="Escala do solicitante não encontrada")

    escala_destinatario = db.query(Escala).filter(
        Escala.DataEscala == data_destinatario,
        Escala.Horario == troca.horariodestinatario
    ).first()

    if not escala_destinatario:
        raise HTTPException(status_code=404, detail="Escala do destinatário não encontrada")

    escala_solicitante.Nome = troca.destinatario
    escala_destinatario.Nome = troca.solicitante

    troca.situacao = "Aprovada"

    db.commit()
    db.refresh(troca)
    return troca


@router.put("/{troca_id}/rejeitar", response_model=TrocaResponse)
def rejeitar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")
    troca.situacao = "Rejeitada"
    db.commit()
    db.refresh(troca)
    return troca


# =================== DELETE AJUSTADO ===================
@router.delete("/{troca_id}")
def deletar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    # Agora permite deletar Pendente ou Aguardando Destinatario
    if troca.situacao not in ["Pendente", "Aguardando Destinatario"]:
        raise HTTPException(
            status_code=400,
            detail="Só é possível deletar trocas com situação Pendente ou Aguardando Destinatario"
        )

    db.delete(troca)
    db.commit()
    return {"detail": "Troca deletada com sucesso"}


@router.put("/{troca_id}/desfazer", response_model=TrocaResponse)
def desfazer_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aprovada":
        raise HTTPException(
            status_code=400,
            detail="Só é possível desfazer trocas já aprovadas"
        )

    data_solicitante = converter_data(troca.meudia)
    data_destinatario = converter_data(troca.diacolega)

    escala_solicitante = db.query(Escala).filter(
        Escala.DataEscala == data_solicitante,
        Escala.Horario == troca.horariosolicitante
    ).first()

    escala_destinatario = db.query(Escala).filter(
        Escala.DataEscala == data_destinatario,
        Escala.Horario == troca.horariodestinatario
    ).first()

    escala_solicitante.Nome = troca.solicitante
    escala_destinatario.Nome = troca.destinatario

    troca.situacao = "Desfeita"

    db.commit()
    db.refresh(troca)
    return troca
