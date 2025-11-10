from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.trocasModels import Troca
from schemas.trocasSchemas import TrocaCreate, TrocaResponse
from typing import List

router = APIRouter(prefix="/trocas", tags=["Trocas"])

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
        status=troca.status or "Pendente"
    )
    db.add(nova_troca)
    db.commit()
    db.refresh(nova_troca)
    return nova_troca
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
    troca.status = "Aprovada"
    db.commit()
    db.refresh(troca)
    return troca

@router.put("/{troca_id}/rejeitar", response_model=TrocaResponse)
def rejeitar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")
    troca.status = "Rejeitada"
    db.commit()
    db.refresh(troca)
    return troca
@router.delete("/{troca_id}")
def deletar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")
    
    if troca.situacao != "Pendente":
        raise HTTPException(
            status_code=400, 
            detail="Só é possível deletar trocas com status Pendente"
        )
    
    db.delete(troca)
    db.commit()
    return {"detail": "Troca deletada com sucesso"}
