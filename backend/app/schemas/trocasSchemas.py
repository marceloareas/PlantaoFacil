from pydantic import BaseModel

class TrocaCreate(BaseModel):
    solicitante: str
    destinatario: str
    meudia: str
    horariosolicitante: str
    diacolega: str
    horariodestinatario: str
    motivo: str | None = None
    situacao: str


class TrocaUpdate(BaseModel):
    destinatario: str
    meudia: str
    horariosolicitante: str
    diacolega: str
    horariodestinatario: str
    motivo: str | None = None


class TrocaResponse(TrocaCreate):
    id: int

    class Config:
        orm_mode = True
