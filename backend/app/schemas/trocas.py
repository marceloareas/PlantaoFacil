from pydantic import BaseModel
from datetime import date

class TrocaBase(BaseModel):
    solicitante: str
    destinatario: str
    data: date
    horario: str
    motivo: str | None = None
    status: str = "Pendente"

class TrocaCreate(TrocaBase):
    pass

class TrocaResponse(TrocaBase):
    id: int

    class Config:
        orm_mode = True
