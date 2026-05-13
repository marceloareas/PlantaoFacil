from validators.turnosConsecutivos import verificar_turnos_consecutivos
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.escalaDiaModels import Escala
from schemas.escalaDiaSchemas import EscalaDiaCreate
from datetime import datetime

router = APIRouter(prefix="/escaladodia", tags=["Escala do Dia"])


@router.post("/{data}")
def create_escala_do_dia(data: str, escala_dia: EscalaDiaCreate, db: Session = Depends(get_db)):
    escalas_criadas = []
    data_dt = datetime.strptime(data, "%d-%m-%Y")
    try:
        for item in escala_dia.Escala:

            verificacao = verificar_turnos_consecutivos(
                db,
                item.Cpf,
                data_dt,
                item.Horario
            )
                
            if verificacao:
                print(f"bloqueio para o usuario {item.Nome} devido a 3 turnos seguidos")
                raise HTTPException(status_code=400, detail=f"devido a 3 turnos seguidos do usuario {item.Nome}, a alocação foi bloqueada")
            
            nova_escala = Escala(
                DataEscala=data,
                Horario=item.Horario,
                Nome=item.Nome,
                Cargo=item.Cargo,
                Cpf=item.Cpf
            )
            db.add(nova_escala)
            escalas_criadas.append(nova_escala)
            db.flush()  # Garante que o novo registro seja processado antes da próxima iteração
        db.commit()
        for e in escalas_criadas:
            db.refresh(e)
        return escalas_criadas
    except Exception as e:
            db.rollback()
            raise e

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
    data_dt = datetime.strptime(data, "%d-%m-%Y")

    try:

        if escalas_antigas:
            for e in escalas_antigas:

                db.delete(e)
            db.flush()

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
            
            nova_escala = Escala(
                DataEscala=data,
                Horario=item.Horario,
                Nome=item.Nome,
                Cargo=item.Cargo,
                Cpf=item.Cpf
            )
            db.add(nova_escala)
            novas_escalas.append(nova_escala)
            db.flush()  # Garante que o novo registro seja processado antes da próxima iteração

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

    except Exception as e:
        db.rollback()
        raise e