from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class Falta(Base):
    __tablename__ = "faltas"
    __table_args__ = (UniqueConstraint("cpf", "data", "horario", name="uq_falta_turno"),)

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(14), ForeignKey("users.cpf"), nullable=False, index=True)
    nome = Column(String(255), nullable=False)
    data = Column(Date, nullable=False, index=True)
    horario = Column(String(20), nullable=False)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    observacao = Column(String(500), nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    registrado_em = Column(DateTime, nullable=False, default=datetime.now)

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])
