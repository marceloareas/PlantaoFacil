from pydantic import BaseModel, field_validator
from typing import Optional

MOTIVOS_INDISPONIBILIDADE = ("Doença", "Férias", "Imprevisto", "Acidente", "Outro")


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
    descricao: Optional[str] = None
    remover_da_escala: bool = False

    @field_validator("motivo")
    @classmethod
    def validar_motivo(cls, v):
        if v not in MOTIVOS_INDISPONIBILIDADE:
            raise ValueError(f"Motivo deve ser um destes: {', '.join(MOTIVOS_INDISPONIBILIDADE)}")
        return v

    @field_validator("descricao")
    @classmethod
    def limpar_descricao(cls, v):
        if v is None:
            return None
        v = v.strip()
        if len(v) > 1000:
            raise ValueError("A descrição pode ter no máximo 1000 caracteres")
        return v or None

    class Config:
        orm_mode = True
