from pydantic import BaseModel

class TrocaCreate(BaseModel):
    cpfSolicitante: str
    cpfDestinatario: str
    meudia: str
    horariosolicitante: str
    diacolega: str
    horariodestinatario: str
    motivo: str | None = None
    situacao: str | None = None


class TrocaUpdate(BaseModel):
    cpfDestinatario: str
    meudia: str
    horariosolicitante: str
    diacolega: str
    horariodestinatario: str
    motivo: str | None = None


class TrocaResponse(TrocaCreate):
    id: int
    nomeSolicitante: str
    nomeDestinatario: str

    class Config:
        orm_mode = True
