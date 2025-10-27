from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.funcAusentesModels import Ausentes
from schemas.funcAusentesSchemas import AusentesCreate

router = APIRouter(prefix="/ausentes", tags=["Funcionários Ausentes"])

@router.post("/")
def create_ausente(ausente: AusentesCreate, db: Session = Depends(get_db)):
    existente = db.query(Ausentes).filter(
        Ausentes.cpf == ausente.cpf,
        Ausentes.data == ausente.data
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Esse funcionário já está registrado como ausente nessa data.")

    novo_ausente = Ausentes(
        ausente=ausente.ausente,
        nome=ausente.nome,
        cpf=ausente.cpf,
        data=ausente.data,
        horario=ausente.horario,
        cargo=ausente.cargo
    )

    db.add(novo_ausente)
    db.commit()
    db.refresh(novo_ausente)

    return {
        "message": "Funcionário ausente registrado com sucesso",
        "ausente": {
            "cpf": novo_ausente.cpf,
            "nome": novo_ausente.nome,
            "data": novo_ausente.data,
            "horario": novo_ausente.horario,
            "cargo": novo_ausente.cargo
        }
    }


@router.get("/")
def get_todos_ausentes(db: Session = Depends(get_db)):
    ausentes = db.query(Ausentes).all()
    if not ausentes:
        raise HTTPException(status_code=404, detail="Nenhum funcionário ausente encontrado.")
    return ausentes


@router.get("/{data}")
def get_ausentes_por_data(data: str, db: Session = Depends(get_db)):
    ausentes = db.query(Ausentes).filter(Ausentes.data == data).all()
    if not ausentes:
        raise HTTPException(status_code=404, detail="Nenhum funcionário ausente nessa data.")
    return ausentes


@router.delete("/{cpf}")
def delete_ausente(cpf: str, db: Session = Depends(get_db)):
    ausente = db.query(Ausentes).filter(Ausentes.cpf == cpf).first()

    if not ausente:
        raise HTTPException(status_code=404, detail="Funcionário ausente não encontrado.")

    db.delete(ausente)
    db.commit()

    return {"message": f"Funcionário {ausente.nome} removido da lista de ausentes."}
