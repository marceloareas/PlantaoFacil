from pydantic import BaseModel
from typing import List

class EscalaItem(BaseModel):
    Horario: str
    Nome: str
    Cargo: str
    Cpf: str

class EscalaDiaCreate(BaseModel):
    DataEscala: str
    Escala: List[EscalaItem]
