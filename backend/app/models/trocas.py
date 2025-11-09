from sqlalchemy import Column, Integer, String, Date
from database import Base

class Troca(Base):
    __tablename__ = "trocas"

    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String, nullable=False)
    destinatario = Column(String, nullable=False)
    data = Column(Date, nullable=False)
    horario = Column(String, nullable=False)
    motivo = Column(String, nullable=True)
    status = Column(String, default="Pendente")  # Pendente, Aprovada, Rejeitada
