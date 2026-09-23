from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class Setor(Base):
    __tablename__ = "setores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)

    usuarios = relationship("User", back_populates="setor")
