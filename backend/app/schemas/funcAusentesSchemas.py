from pydantic import BaseModel
from datetime import date, time

class AusentesCreate(BaseModel):
    ausente: str
    nome: str
    cpf: str
    data: str
    horario: str
    cargo: str

    class Config:
        orm_mode = True
