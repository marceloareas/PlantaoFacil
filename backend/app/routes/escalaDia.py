from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.escalaDiaModels import Escala
from schemas.escalaDiaSchemas import EscalaDiaCreate

router = APIRouter(prefix="/escaladodia", tags=["Escala do Dia"])

@router.post("/{data}")
def create_escala_do_dia(data: str, escala_dia: EscalaDiaCreate, db: Session = Depends(get_db)):
    escalas_criadas = []
    for item in escala_dia.Escala:
        nova_escala = Escala(
            DataEscala=data,
            Horario=item.Horario,
            Nome=item.Nome,
            Cargo=item.Cargo,
            Cpf=item.Cpf
        )
        db.add(nova_escala)
        escalas_criadas.append(nova_escala)
    db.commit()
    for e in escalas_criadas:
        db.refresh(e)
    return escalas_criadas

@router.get("/{data}")
def get_escala_do_dia(data: str, db: Session = Depends(get_db)):
    escalas = db.query(Escala).filter(Escala.DataEscala == data).all()

    if not escalas:
        raise HTTPException(status_code=404, detail="Nenhuma escala encontrada para essa data")

    resultado = [
        {
            "Horario": e.Horario,
            "Nome": e.Nome,
            "Cargo": e.Cargo,
            "Cpf": e.Cpf
        }
        for e in escalas
    ]

    return {
        "DataEscala": data,
        "Escala": resultado
    }
@router.put("/{data}")
def update_escala_do_dia(data: str, escala_dia: EscalaDiaCreate, db: Session = Depends(get_db)):
    escalas_antigas = db.query(Escala).filter(Escala.DataEscala == data).all()

    if escalas_antigas:
        for e in escalas_antigas:
            db.delete(e)
        db.commit()

    novas_escalas = []
    for item in escala_dia.Escala:
        nova_escala = Escala(
            DataEscala=data,
            Horario=item.Horario,
            Nome=item.Nome,
            Cargo=item.Cargo,
            Cpf=item.Cpf
        )
        db.add(nova_escala)
        novas_escalas.append(nova_escala)

    db.commit()
    for e in novas_escalas:
        db.refresh(e)

    return {
        "message": "Escala atualizada com sucesso",
        "DataEscala": data,
        "Escala": [
            {"Horario": e.Horario, "Nome": e.Nome, "Cargo": e.Cargo, "Cpf": e.Cpf}
            for e in novas_escalas
        ]
    }