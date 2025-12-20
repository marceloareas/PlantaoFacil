from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    crm: str
    cpf: str
    nome_completo: str
    cargo: str
    horaEscala: str
    situacao: str

class UserLogin(BaseModel):
    email: str
    password: str