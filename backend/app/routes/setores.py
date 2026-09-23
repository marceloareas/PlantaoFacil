from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, require_coordenador
from database import get_db
from models.escalaDiaModels import Escala
from models.setorModels import Setor
from models.userModels import User
from schemas.setorSchemas import SetorCreate

router = APIRouter(prefix="/setores", tags=["Setores"])


def _serializar(setor: Setor, total_funcionarios: int) -> dict:
    return {"id": setor.id, "nome": setor.nome, "total_funcionarios": total_funcionarios}


def _total_funcionarios(db: Session, setor_id: int) -> int:
    return db.query(User).filter(User.setor_id == setor_id).count()


def _buscar_setor(db: Session, setor_id: int) -> Setor:
    setor = db.get(Setor, setor_id)
    if not setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    return setor


def _validar_nome_disponivel(db: Session, nome: str, ignorar_id: int | None = None) -> None:
    query = db.query(Setor).filter(func.lower(Setor.nome) == nome.lower())
    if ignorar_id is not None:
        query = query.filter(Setor.id != ignorar_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Já existe um setor com esse nome")


@router.get("/", dependencies=[Depends(get_current_user)])
def listar_setores(db: Session = Depends(get_db)):
    contagem = dict(
        db.query(User.setor_id, func.count(User.id))
        .filter(User.setor_id.isnot(None))
        .group_by(User.setor_id)
        .all()
    )
    setores = db.query(Setor).order_by(Setor.nome).all()
    return [_serializar(s, contagem.get(s.id, 0)) for s in setores]


@router.post("/", status_code=201, dependencies=[Depends(require_coordenador)])
def criar_setor(payload: SetorCreate, db: Session = Depends(get_db)):
    _validar_nome_disponivel(db, payload.nome)
    setor = Setor(nome=payload.nome)
    db.add(setor)
    db.commit()
    db.refresh(setor)
    return _serializar(setor, 0)


@router.put("/{setor_id}", dependencies=[Depends(require_coordenador)])
def renomear_setor(setor_id: int, payload: SetorCreate, db: Session = Depends(get_db)):
    setor = _buscar_setor(db, setor_id)
    _validar_nome_disponivel(db, payload.nome, ignorar_id=setor_id)
    setor.nome = payload.nome
    db.commit()
    db.refresh(setor)
    return _serializar(setor, _total_funcionarios(db, setor_id))


@router.delete("/{setor_id}", dependencies=[Depends(require_coordenador)])
def excluir_setor(setor_id: int, db: Session = Depends(get_db)):
    setor = _buscar_setor(db, setor_id)

    if _total_funcionarios(db, setor_id) > 0:
        raise HTTPException(
            status_code=400,
            detail="O setor possui funcionários. Transfira-os para outro setor antes de excluir.",
        )
    if db.query(Escala).filter(Escala.setor_id == setor_id).first():
        raise HTTPException(
            status_code=400,
            detail="O setor possui escalas cadastradas e não pode ser excluído.",
        )

    db.delete(setor)
    db.commit()
    return {"message": f"Setor {setor.nome} excluído com sucesso"}
