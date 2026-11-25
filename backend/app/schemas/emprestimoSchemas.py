from datetime import date

from pydantic import BaseModel, constr, field_validator


class EmprestimoCreate(BaseModel):
    cpf: constr(min_length=1, strip_whitespace=True)
    setor_destino_id: int
    data_inicio: date
    data_fim: date
    turno: str
    # primeiro dia de trabalho no setor de destino; se vazio, é o próprio início
    primeiro_dia: date | None = None

    @field_validator("primeiro_dia", mode="before")
    @classmethod
    def vazio_como_nulo(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v
