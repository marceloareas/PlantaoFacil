from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.dependencies import get_setor_id, require_coordenador
from database import get_db
from models.periodoModels import Periodo
from models.setorModels import Setor
from services.limitesService import situacao_do_periodo
from services.periodoService import hoje, periodo_da_data, serializar_periodo

router = APIRouter(prefix="/avisos", tags=["Avisos"])


@router.get("/", dependencies=[Depends(require_coordenador)])
def listar_avisos(
    periodo_id: int | None = None,
    setor_id: int = Depends(get_setor_id),
    db: Session = Depends(get_db),
):
    if periodo_id is not None:
        periodo = db.get(Periodo, periodo_id)
        if not periodo or periodo.setor_id != setor_id:
            raise HTTPException(status_code=404, detail="Período não encontrado")
    else:
        periodo = periodo_da_data(db, setor_id, hoje())

    if not periodo:
        setor = db.get(Setor, setor_id)
        return {
            "periodo": None,
            "limites": {
                "max_extras_periodo": setor.max_extras_periodo,
                "max_trocas_periodo": setor.max_trocas_periodo,
            },
            "funcionarios": [],
            "avisos": [],
        }

    return {"periodo": serializar_periodo(periodo), **situacao_do_periodo(db, periodo)}


@router.get("/abertos", dependencies=[Depends(require_coordenador)])
def listar_avisos_abertos(
    setor_id: int = Depends(get_setor_id),
    db: Session = Depends(get_db),
):
    """Avisos do período atual e dos futuros, cada um com o seu período."""
    periodos = (
        db.query(Periodo)
        .filter(Periodo.setor_id == setor_id, Periodo.data_fim >= hoje())
        .order_by(Periodo.data_inicio)
        .all()
    )
    avisos = []
    for periodo in periodos:
        dados_periodo = serializar_periodo(periodo)
        avisos.extend({**aviso, "periodo": dados_periodo} for aviso in situacao_do_periodo(db, periodo)["avisos"])
    return {"avisos": avisos}
