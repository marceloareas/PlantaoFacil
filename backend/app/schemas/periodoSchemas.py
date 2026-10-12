from datetime import date

from pydantic import BaseModel, model_validator


class PeriodoCreate(BaseModel):
    data_inicio: date
    data_fim: date

    @model_validator(mode="after")
    def validar_intervalo(self):
        if self.data_inicio > self.data_fim:
            raise ValueError(
                "A data de início não pode ser posterior à data de fim"
            )

        return self
