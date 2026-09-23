from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_coordinator
from database import get_db
from models.periodoModels import Periodo
from models.userModels import User
from schemas.periodoSchemas import PeriodoCreate


router = APIRouter(prefix="/periodos", tags=["Períodos"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_periodo(
	payload: PeriodoCreate,
	db: Session = Depends(get_db),
	coordenador: User = Depends(get_current_coordinator),
):
	periodo = Periodo(
		data_inicio=payload.data_inicio,
		data_fim=payload.data_fim,
	)

	db.add(periodo)
	db.commit()
	db.refresh(periodo)

	return periodo