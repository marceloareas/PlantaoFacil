from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CargoBase(BaseModel):
    nome: str
    is_active: bool = True

class CargoCreate(CargoBase):
    pass

class CargoRead(CargoBase):
    id: int
    class Config:
        orm_mode = True


class UsuarioBase(BaseModel):
    nome: str
    sobrenome: Optional[str]
    email: str
    cargo_id: Optional[int]
    turno: Optional[str]
    is_gerente: bool = False

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioRead(UsuarioBase):
    id: int
    class Config:
        orm_mode = True


class PlantaoBase(BaseModel):
    hora_inicio: datetime
    hora_fim: datetime
    usuario_id: int

class PlantaoCreate(PlantaoBase):
    pass

class PlantaoRead(PlantaoBase):
    id: int
    class Config:
        orm_mode = True
