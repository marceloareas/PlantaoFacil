import json
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.dependencies import get_setor_id
from database import get_db
from models.escalaDiaModels import Escala
from models.funcAusentesModels import Ausentes
from services.escalaPeriodoService import turno_bloqueado_por_ausencia
from services.periodoService import ler_data
from models.userModels import User
from schemas.funcAusentesSchemas import AusentesCreate


def _ausentes_do_setor(db: Session, setor_id: int):
    return db.query(Ausentes).join(User, Ausentes.cpf == User.cpf).filter(User.setor_id == setor_id)

router = APIRouter(prefix="/ausentes", tags=["Funcionários Ausentes"])

@router.post("/")
def create_ausente(ausente: AusentesCreate, db: Session = Depends(get_db)):
    existente = db.query(Ausentes).filter(
        Ausentes.cpf == ausente.cpf,
        Ausentes.data == ausente.data
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Esse funcionário já está registrado como ausente nessa data.")

    try:
        periodo_ausencia = SimpleNamespace(
            data=ler_data(ausente.data),
            data_final=ler_data(ausente.data_final) if ausente.data_final else None,
            horario=ausente.horario,
            horario_final=ausente.horario_final,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")

    novo_ausente = Ausentes(
        ausente=ausente.ausente,
        nome=ausente.nome,
        cpf=ausente.cpf,
        data=ausente.data,
        data_final=ausente.data_final,
        horario=ausente.horario,
        horario_final=ausente.horario_final,
        cargo=ausente.cargo,
        motivo=ausente.motivo,
        descricao=ausente.descricao,
        remover_da_escala=ausente.remover_da_escala,
    )

    db.add(novo_ausente)

    # "Remover da escala? Sim": tira os plantões do funcionário nos turnos em que está indisponível
    removidos_da_escala = []
    if ausente.remover_da_escala:
        for linha in db.query(Escala).filter(Escala.Cpf == ausente.cpf).all():
            try:
                dia = ler_data(linha.DataEscala)
            except ValueError:
                continue
            if turno_bloqueado_por_ausencia(dia, linha.Horario, periodo_ausencia):
                removidos_da_escala.append({
                    "data": linha.DataEscala,
                    "horario": linha.Horario,
                    "nome": linha.Nome,
                    "cargo": linha.Cargo,
                    "setor_id": linha.setor_id,
                    "tipo": linha.tipo or "regular",
                })
                db.delete(linha)
        novo_ausente.plantoes_removidos = json.dumps(removidos_da_escala, ensure_ascii=False)

    db.commit()
    db.refresh(novo_ausente)

    return {
        "message": "Funcionário ausente registrado com sucesso",
        "ausente": {
            "cpf": novo_ausente.cpf,
            "nome": novo_ausente.nome,
            "data": novo_ausente.data,
            "data_final": novo_ausente.data_final,
            "horario": novo_ausente.horario,
            "horario_final": novo_ausente.horario_final,
            "cargo": novo_ausente.cargo,
            "motivo": novo_ausente.motivo,
            "descricao": novo_ausente.descricao,
            "remover_da_escala": novo_ausente.remover_da_escala,
        },
        "removidos_da_escala": [{"data": r["data"], "horario": r["horario"]} for r in removidos_da_escala],
    }


@router.get("/")
def get_todos_ausentes(setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    ausentes = _ausentes_do_setor(db, setor_id).all()
    if not ausentes:
        raise HTTPException(status_code=404, detail="Nenhum funcionário ausente encontrado.")
    return ausentes

@router.get("/{data}")
def get_ausentes_por_data(data: str, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    from sqlalchemy import or_, and_

    data_consulta = data 

    ausentes = (
        _ausentes_do_setor(db, setor_id)
        .filter(
            and_(
                Ausentes.data <= data_consulta,
                or_(
                    Ausentes.data_final == None,
                    Ausentes.data_final >= data_consulta
                )
            )
        )
        .all()
    )

    if not ausentes:
        return []

    return ausentes


@router.delete("/{ausente_id}")
def delete_ausente(ausente_id: int, db: Session = Depends(get_db)):
    ausente = db.get(Ausentes, ausente_id)

    if not ausente:
        raise HTTPException(status_code=404, detail="Indisponibilidade não encontrada.")

    nome = ausente.nome

    # desfaz o "Remover da escala": devolve os plantões que foram retirados
    restaurados, nao_restaurados = [], []
    if ausente.remover_da_escala and ausente.plantoes_removidos:
        for plantao in json.loads(ausente.plantoes_removidos):
            ocupado = db.query(Escala).filter(
                Escala.Cpf == ausente.cpf,
                Escala.DataEscala == plantao["data"],
                Escala.Horario == plantao["horario"],
            ).first()
            if ocupado:
                nao_restaurados.append({
                    "data": plantao["data"],
                    "horario": plantao["horario"],
                    "motivo": "Já está escalado nesse turno",
                })
                continue

            db.add(Escala(
                DataEscala=plantao["data"],
                Horario=plantao["horario"],
                Nome=plantao.get("nome") or nome,
                Cargo=plantao.get("cargo") or ausente.cargo,
                Cpf=ausente.cpf,
                setor_id=plantao.get("setor_id"),
                tipo=plantao.get("tipo") or "regular",
            ))
            db.flush()
            restaurados.append({"data": plantao["data"], "horario": plantao["horario"]})

    db.delete(ausente)
    db.commit()

    return {
        "message": f"Indisponibilidade de {nome} removida.",
        "restaurados": restaurados,
        "nao_restaurados": nao_restaurados,
    }
