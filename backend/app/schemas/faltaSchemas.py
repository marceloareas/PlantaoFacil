from datetime import date

from pydantic import BaseModel, constr, field_validator

from services.periodoService import ler_data


class FaltaCreate(BaseModel):
    cpf: constr(min_length=1, strip_whitespace=True)
    data: date
    horario: constr(min_length=1)
    observacao: constr(max_length=500, strip_whitespace=True) | None = None

    @field_validator("data", mode="before")
    @classmethod
    def validar_data(cls, v):
        # aceita DD-MM-AAAA (formato da escala) e AAAA-MM-DD
        if isinstance(v, str):
            return ler_data(v.strip())
        return v

    @field_validator("observacao")
    @classmethod
    def limpar_observacao(cls, v):
        return v or None
