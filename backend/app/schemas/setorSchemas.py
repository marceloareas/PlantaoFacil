from pydantic import BaseModel, conint, constr


class SetorCreate(BaseModel):
    nome: constr(min_length=2, max_length=100, strip_whitespace=True)


class SetorParametros(BaseModel):
    max_extras_periodo: conint(ge=0, le=999)
    max_trocas_periodo: conint(ge=0, le=999)
