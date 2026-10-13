from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from database import Base


class Periodo(Base):
    __tablename__ = "periodos"

    id = Column(Integer, primary_key=True, index=True)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=True, index=True)
    data_inicio = Column(Date, nullable=False, index=True)
    data_fim = Column(Date, nullable=False, index=True)
    escala_gerada_em = Column(DateTime, nullable=True)

    setor = relationship("Setor")
