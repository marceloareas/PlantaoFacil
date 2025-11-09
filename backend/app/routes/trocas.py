from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.trocas import Troca
from schemas.trocas import TrocaCreate, TrocaResponse
from typing import List

router = APIRouter(
    prefix="/trocas",
    tags=["Trocas"]
)

# 📩 Criar nova solicitação
@router.post("/", response_model=TrocaResponse)
def criar_troca(troca: TrocaCreate, db: Session = Depends(get_db)):
    nova_troca = Troca(**troca.dict())
    db.add(nova_troca)
    db.commit()
    db.refresh(nova_troca)
    return nova_troca

# 📋 Listar todas as trocas
@router.get("/", response_model=List[TrocaResponse])
def listar_trocas(db: Session = Depends(get_db)):
    return db.query(Troca).all()

# 📋 Listar trocas de um usuário
@router.get("/usuario/{nome}", response_model=List[TrocaResponse])
def listar_trocas_usuario(nome: str, db: Session = Depends(get_db)):
    trocas = db.query(Troca).filter(
        (Troca.solicitante == nome) | (Troca.destinatario == nome)
    ).all()
    return trocas

# ✅ Aprovar troca
@router.put("/{id}/aprovar", response_model=TrocaResponse)
def aprovar_troca(id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    troca.status = "Aprovada"
    db.commit()
    db.refresh(troca)
    return troca

# ❌ Rejeitar troca
@router.put("/{id}/rejeitar", response_model=TrocaResponse)
def rejeitar_troca(id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    troca.status = "Rejeitada"
    db.commit()
    db.refresh(troca)
    return troca
