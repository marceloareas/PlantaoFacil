from pydantic import BaseModel, EmailStr, field_validator, constr
from validate_docbr import CPF
import re

cpf_validator = CPF()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    crm: str
    cpf: str
    nome_completo: constr(min_length=3, strip_whitespace=True)
    cargo: str
    horaEscala: str
    situacao: str

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v):
        # remove máscara
        cpf = re.sub(r'\D', '', v)

        # tamanho obrigatório
        if len(cpf) != 11:
            raise ValueError("CPF deve ter 11 dígitos")

        # valida usando bliblioteca regra do digito de validação
        if not cpf_validator.validate(cpf):
            raise ValueError("CPF inválido")

        return cpf 

    @field_validator("crm")
    @classmethod
    def validar_crm(cls, v):

        """
        Formato do CRM:
        123456-RJ/ENF

        Regras:
        - 4 a 6 números
        - hífen
        -  2 letras
        - /
        -  2 a 4 letras
        """

        crm = v.strip().upper()

        regex = r'^\d{4,6}-[A-Z]{2}/[A-Z]{2,4}$'

        if not re.match(regex, crm):
            raise ValueError("CRM deve estar no formato 123456-RJ/ENF")

        return crm
    
    @field_validator("horaEscala")
    @classmethod
    def validar_hora_escala(cls, v):
        if not v in ["12x36", "12x60"]:
            raise ValueError("horaEscala deve ser '12x36' ou '12x60'")
        return v


class UserLogin(BaseModel):
    email: str