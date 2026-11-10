from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.dependencies import get_setor_id, require_coordenador
from database import get_db
from models.emprestimoModels import Emprestimo
from models.userModels import User
from schemas.emprestimoSchemas import EmprestimoCreate
from services.emprestimoService import (
    criar_emprestimo_por_intervalo,
    emprestimos_do_setor_no_dia,
    funcionarios_emprestaveis,
    serializar_emprestimo,
)
from services.periodoService import FORMATO_ESCALA, ler_data

router = APIRouter(prefix="/emprestimos", tags=["Empréstimos"])


def _usuario_resumido(user: User) -> dict:
    return {
        "id": user.id,
        "nome_completo": user.nome_completo,
        "cpf": user.cpf,
        "cargo": user.cargo,
        "situacao": user.situacao,
        "setor_id": user.setor_id,
        "setor_nome": user.setor.nome if user.setor else None,
    }


@router.get("/", dependencies=[Depends(require_coordenador)])
def listar_emprestimos(setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    """Empréstimos por intervalo em que o setor cede ou recebe funcionários."""
    emprestimos = (
        db.query(Emprestimo)
        .filter(or_(Emprestimo.setor_origem_id == setor_id, Emprestimo.setor_destino_id == setor_id))
        .order_by(Emprestimo.data_inicio.desc())
        .all()
    )
    return [serializar_emprestimo(e) for e in emprestimos]


@router.post("/", status_code=201)
def criar_emprestimo(
    payload: EmprestimoCreate,
    usuario: User = Depends(require_coordenador),
    db: Session = Depends(get_db),
):
    try:
        return criar_emprestimo_por_intervalo(db, payload, usuario)
    except Exception:
        db.rollback()
        raise


@router.get("/dia/{data}", dependencies=[Depends(require_coordenador)])
def emprestimos_do_dia(data: str, setor_id: int = Depends(get_setor_id), db: Session = Depends(get_db)):
    """Para a tela de edição da escala: quem saiu do setor, quem veio de outro setor e quem pode ser emprestado."""
    try:
        dia = ler_data(data)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida, use o formato DD-MM-AAAA")

    saindo, entrando = emprestimos_do_setor_no_dia(db, setor_id, dia)

    return {
        "data": dia.strftime(FORMATO_ESCALA),
        "emprestados_para_fora": [
            {
                "cpf": e.cpf,
                "nome": e.user.nome_completo if e.user else e.cpf,
                "setor_destino": e.setor_destino.nome if e.setor_destino else None,
            }
            for e in saindo
        ],
        "recebidos": [
            {**_usuario_resumido(e.user), "emprestimo_id": e.id}
            for e in entrando
            if e.user
        ],
        "disponiveis": [_usuario_resumido(u) for u in funcionarios_emprestaveis(db, setor_id, dia)],
    }
