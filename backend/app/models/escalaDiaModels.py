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
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True)
    # "regular" quando veio da escala do período, "extra" quando foi adicionado depois dela
    tipo = Column(String(10), nullable=False, default="regular", server_default="regular")
    user = relationship("User", back_populates="escalas")
    setor = relationship("Setor")

