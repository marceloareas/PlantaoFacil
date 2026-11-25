from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Emprestimo(Base):
    """Empréstimo por intervalo: o funcionário sai da escala do setor de origem e
    trabalha no setor de destino entre data_inicio e data_fim (inclusive).

    O empréstimo de um único plantão não fica aqui: é só uma linha da escala do
    setor de destino com tipo "extra" de um funcionário de outro setor.
    """

    __tablename__ = "emprestimos"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(14), ForeignKey("users.cpf"), nullable=False, index=True)
    setor_origem_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    setor_destino_id = Column(Integer, ForeignKey("setores.id"), nullable=False, index=True)
    data_inicio = Column(Date, nullable=False, index=True)
    data_fim = Column(Date, nullable=False, index=True)
    turno = Column(String(20), nullable=False)
    # primeiro dia de trabalho no setor de destino; o regime (12x36/12x60) segue a partir dele
    primeiro_dia = Column(Date, nullable=False)
    criado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    criado_em = Column(DateTime, nullable=False, default=datetime.now)

    user = relationship("User", foreign_keys=[cpf])
    setor_origem = relationship("Setor", foreign_keys=[setor_origem_id])
    setor_destino = relationship("Setor", foreign_keys=[setor_destino_id])
    criado_por = relationship("User", foreign_keys=[criado_por_id])
