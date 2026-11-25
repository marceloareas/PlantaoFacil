from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, get_setor_id, require_coordenador
from database import get_db
from models.periodoModels import Periodo
from schemas.periodoSchemas import PeriodoCreate
from services.escalaPeriodoService import gerar_escala_do_periodo
from services.periodoService import calcular_data_fim, hoje, periodo_da_data, serializar_periodo


router = APIRouter(prefix="/periodos", tags=["Períodos"])


def _formatar(data: date) -> str:
	return data.strftime("%d/%m/%Y")


def _buscar_periodo(db: Session, periodo_id: int, setor_id: int) -> Periodo:
	periodo = db.get(Periodo, periodo_id)
	if not periodo or periodo.setor_id != setor_id:
		raise HTTPException(status_code=404, detail="Período não encontrado")
	return periodo


@router.get("/", dependencies=[Depends(get_current_user)])
def listar_periodos(
	setor_id: int = Depends(get_setor_id),
	db: Session = Depends(get_db),
):
	periodos = (
		db.query(Periodo)
		.filter(Periodo.setor_id == setor_id)
		.order_by(Periodo.data_inicio.desc())
		.all()
	)
	return [serializar_periodo(p) for p in periodos]


# declarada antes das rotas com {periodo_id}
@router.get("/vigente", dependencies=[Depends(get_current_user)])
def periodo_vigente(
	data: date | None = Query(default=None),
	setor_id: int = Depends(get_setor_id),
	db: Session = Depends(get_db),
):
	periodo = periodo_da_data(db, setor_id, data or hoje())
	return serializar_periodo(periodo) if periodo else None


@router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_coordenador)])
def criar_periodo(
	payload: PeriodoCreate,
	setor_id: int = Depends(get_setor_id),
	db: Session = Depends(get_db),
):
	data_fim = calcular_data_fim(payload.data_inicio)

	conflito = (
		db.query(Periodo)
		.filter(
			Periodo.setor_id == setor_id,
			Periodo.data_inicio <= data_fim,
			Periodo.data_fim >= payload.data_inicio,
		)
		.order_by(Periodo.data_inicio)
		.first()
	)
	if conflito:
		raise HTTPException(
			status_code=400,
			detail=f"Já existe um período neste setor de {_formatar(conflito.data_inicio)} a {_formatar(conflito.data_fim)}",
		)

	periodo = Periodo(
		setor_id=setor_id,
		data_inicio=payload.data_inicio,
		data_fim=data_fim,
	)

	db.add(periodo)
	db.commit()
	db.refresh(periodo)

	return serializar_periodo(periodo)


@router.delete("/{periodo_id}", dependencies=[Depends(require_coordenador)])
def excluir_periodo(
	periodo_id: int,
	setor_id: int = Depends(get_setor_id),
	db: Session = Depends(get_db),
):
	periodo = _buscar_periodo(db, periodo_id, setor_id)

	if periodo.escala_gerada_em:
		raise HTTPException(
			status_code=400,
			detail="A escala deste período já foi gerada e ele não pode ser excluído",
		)

	inicio, fim = _formatar(periodo.data_inicio), _formatar(periodo.data_fim)
	db.delete(periodo)
	db.commit()

	return {"message": f"Período de {inicio} a {fim} excluído com sucesso"}


@router.post("/{periodo_id}/gerar-escala", dependencies=[Depends(require_coordenador)])
def gerar_escala(
	periodo_id: int,
	setor_id: int = Depends(get_setor_id),
	db: Session = Depends(get_db),
):
	periodo = _buscar_periodo(db, periodo_id, setor_id)

	try:
		return gerar_escala_do_periodo(db, periodo)
	except Exception:
		db.rollback()
		raise
