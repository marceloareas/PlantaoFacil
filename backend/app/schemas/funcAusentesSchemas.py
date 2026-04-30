from pydantic import BaseModel
from datetime import date, time
from typing import Optional

class AusentesCreate(BaseModel):
    ausente: str
    nome: str
    cpf: str
    data: str
    data_final: Optional[str] = None
    horario: str
    horario_final: Optional[str] = None
    cargo: str
    motivo: str

    class Config:
        orm_mode = True
