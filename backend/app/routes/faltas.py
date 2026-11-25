from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from core.dependencies import get_setor_id, require_coordenador
from database import get_db
from models.escalaDiaModels import Escala
from models.faltaModels import Falta
from models.userModels import User
from schemas.faltaSchemas import FaltaCreate
from services.periodoService import agora, data_para_escala, hoje

router = APIRouter(prefix="/faltas", tags=["Faltas"])

FALTA_DUPLICADA = "Falta já registrada para este turno"


def _serializar(falta: Falta) -> dict:
    return {
        "id": falta.id,
        "cpf": falta.cpf,
        "nome": falta.nome,
        "data": falta.data.isoformat(),
        "horario": falta.horario,
        "observacao": falta.observacao,
        "registrado_em": falta.registrado_em.isoformat() if falta.registrado_em else None,
        "registrado_por": falta.registrado_por.nome_completo if falta.registrado_por else None,
    }


@router.post("/", status_code=201)
def registrar_falta(
    payload: FaltaCreate,
    usuario: User = Depends(require_coordenador),
    setor_id: int = Depends(get_setor_id),
    db: Session = Depends(get_db),
):
    if payload.data > hoje():
        raise HTTPException(status_code=400, detail="Não é possível registrar falta em uma data futura")

    escalado = db.query(Escala).filter(
        Escala.Cpf == payload.cpf,
        Escala.DataEscala == data_para_escala(payload.data),
        Escala.Horario == payload.horario,
        Escala.setor_id == setor_id,
    ).first()
    if not escalado:
        raise HTTPException(status_code=400, detail="O funcionário não está escalado neste turno")

    duplicada = db.query(Falta).filter(
        Falta.cpf == payload.cpf,
        Falta.data == payload.data,
        Falta.horario == payload.horario,
    ).first()
    if duplicada:
        raise HTTPException(status_code=400, detail=FALTA_DUPLICADA)

    funcionario = db.query(User).filter(User.cpf == payload.cpf).first()
    falta = Falta(
        cpf=payload.cpf,
        nome=funcionario.nome_completo if funcionario else escalado.Nome,
        data=payload.data,
        horario=payload.horario,
        setor_id=setor_id,
        observacao=payload.observacao,
        registrado_por_id=usuario.id,
        registrado_em=agora(),
    )
    db.add(falta)
    try:
        db.commit()
    except IntegrityError:
        # outra requisição registrou a mesma falta entre a checagem e o commit
        db.rollback()
        raise HTTPException(status_code=400, detail=FALTA_DUPLICADA)
    db.refresh(falta)
    return _serializar(falta)


@router.get("/", dependencies=[Depends(require_coordenador)])
def listar_faltas(
    inicio: date | None = None,
    fim: date | None = None,
    cpf: str | None = None,
    setor_id: int = Depends(get_setor_id),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Falta)
        .options(joinedload(Falta.registrado_por))
        .filter(Falta.setor_id == setor_id)
    )
    if inicio is not None:
        query = query.filter(Falta.data >= inicio)
    if fim is not None:
        query = query.filter(Falta.data <= fim)
    if cpf:
        query = query.filter(Falta.cpf == cpf.strip())

    faltas = query.order_by(Falta.data.desc(), Falta.horario).all()
    return [_serializar(f) for f in faltas]


@router.delete("/{falta_id}", dependencies=[Depends(require_coordenador)])
def excluir_falta(falta_id: int, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    falta = db.get(Falta, falta_id)
    if not falta or falta.setor_id != setor_id:
        raise HTTPException(status_code=404, detail="Falta não encontrada")

    nome, data = falta.nome, falta.data
    db.delete(falta)
    db.commit()
    return {"message": f"Falta de {nome} em {data.strftime('%d/%m/%Y')} removida com sucesso"}
