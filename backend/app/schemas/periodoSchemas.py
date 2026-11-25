from datetime import date

from pydantic import BaseModel


class PeriodoCreate(BaseModel):
    # o fim é calculado pelo servidor (calcular_data_fim)
    data_inicio: date
