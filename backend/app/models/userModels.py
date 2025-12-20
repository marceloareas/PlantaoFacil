from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    crm = Column(String(20), unique=True, nullable=True)
    cpf = Column(String(20), unique=True, nullable=True)
    nome_completo = Column(String(255), nullable=False)
    cargo = Column(String(100), nullable=False)
    horaEscala = Column(String(50), nullable=False, default="12X36")
    situacao = Column(String(50), default="Ativo")
