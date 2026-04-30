from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Escala(Base):
    __tablename__ = "escala"

    id = Column(Integer, primary_key=True, index=True)
    DataEscala = Column(String(10), index=True)
    Horario = Column(String(20), nullable=False)
    Nome = Column(String(255), nullable=False)
    Cargo = Column(String(15), nullable=True)
    Cpf = Column(String(14), ForeignKey("users.cpf"), nullable=False)
    user = relationship("User", back_populates="escalas")

