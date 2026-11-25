from pydantic import BaseModel

class EscalaLoteSchemas(BaseModel):
    usuario_id: int
    horario: str
    data_inicio: str
    quantidade_dias: int