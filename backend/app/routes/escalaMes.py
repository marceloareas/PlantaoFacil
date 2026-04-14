from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.escalaDiaModels import Escala
import calendar      #para saber quantos dias tem o mes 30 ou 31

router = APIRouter(prefix="/escalaMes", tags=["Escala do Mês"])

@router.get("/")
def get_escalas_mes(
    mes: int = Query(...),
    ano: int = Query(...),
    cpf: str = Query(...),
    db: Session = Depends(get_db)
):
    dias_no_mes = calendar.monthrange(ano, mes)[1]

    resultado = []

    for dia in range(1, dias_no_mes + 1):
        data_str = f"{dia:02d}-{mes:02d}-{ano}"

        escalas = db.query(Escala).filter(Escala.DataEscala == data_str).all()

        escalado = any(e.Cpf == cpf for e in escalas)

        resultado.append({
            "data": data_str,
            "escalado": escalado
        })

    return resultado