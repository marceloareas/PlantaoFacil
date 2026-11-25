from sqlalchemy import Boolean, Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Ausentes(Base):
    __tablename__ = "ausentes"

    id = Column(Integer, primary_key=True, index=True)
    ausente = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    cpf = Column(String(14), ForeignKey("users.cpf"), nullable=False)
    data = Column(Date, nullable=False)
    data_final = Column(Date, nullable=True)
    horario = Column(String, nullable=False)
    horario_final = Column(String, nullable=True)
    cargo = Column(String, nullable=False)
    # Doença, Férias, Imprevisto, Acidente ou Outro (registros antigos podem ter texto livre)
    motivo = Column(String, nullable=False)
    descricao = Column(String(1000), nullable=True)
    # True: os plantões do funcionário nos turnos indisponíveis foram retirados da escala
    remover_da_escala = Column(Boolean, nullable=False, default=False, server_default="false")
    # plantões retirados (JSON), para devolvê-los à escala se a indisponibilidade for removida
    plantoes_removidos = Column(Text, nullable=True)
    user = relationship("User", back_populates="ausentes")
