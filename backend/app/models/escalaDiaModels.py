from sqlalchemy import Column, Integer, String
from database import Base

class Escala(Base):
    __tablename__ = "escala"

    id = Column(Integer, primary_key=True, index=True)
    DataEscala = Column(String(10), index=True)
    Horario = Column(String(20), nullable=False)
    Nome = Column(String(255), nullable=False)
    Cargo = Column(String(15), nullable=True)
    Cpf = Column(String(14), nullable=False)
