from pydantic import BaseModel, constr


class SetorCreate(BaseModel):
    nome: constr(min_length=2, max_length=100, strip_whitespace=True)
