from sqlalchemy import Column, Integer, String, Date, Time
from database import Base

class Ausentes(Base):
    __tablename__ = "ausentes"

    id = Column(Integer, primary_key=True, index=True)
    ausente = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    cpf = Column(String, nullable=False)
    data = Column(Date, nullable=False)
    data_final = Column(Date, nullable=True)
    horario = Column(String, nullable=False)
    horario_final = Column(String, nullable=True)
    cargo = Column(String, nullable=False)
    motivo = Column(String, nullable=False)
