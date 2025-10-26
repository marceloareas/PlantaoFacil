from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from app.database import Base

class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    usuarios = relationship("Usuario", back_populates="cargo")


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    sobrenome = Column(String)
    email = Column(String, unique=True)
    cargo_id = Column(Integer, ForeignKey("cargo.id"))
    turno = Column(String)
    is_gerente = Column(Boolean, default=False)

    cargo = relationship("Cargo", back_populates="usuarios")
    plantoes = relationship("Plantao", back_populates="usuario")


class Plantao(Base):
    __tablename__ = "plantao"

    id = Column(Integer, primary_key=True, index=True)
    hora_inicio = Column(TIMESTAMP)
    hora_fim = Column(TIMESTAMP)
    usuario_id = Column(Integer, ForeignKey("usuario.id"))

    usuario = relationship("Usuario", back_populates="plantoes")
