from sqlalchemy import inspect, text

from database import Base, engine
from models import setorModels, userModels, escalaDiaModels, funcAusentesModels, trocasModels  # noqa: F401

SETOR_PADRAO = "Geral"


def _adicionar_coluna_setor(conn, tabela: str) -> None:
    colunas = {c["name"] for c in inspect(conn).get_columns(tabela)}
    if "setor_id" not in colunas:
        conn.execute(text(f"ALTER TABLE {tabela} ADD COLUMN setor_id INTEGER REFERENCES setores(id)"))


def preparar_banco() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # create_all não adiciona colunas a tabelas que já existem
        _adicionar_coluna_setor(conn, "users")
        _adicionar_coluna_setor(conn, "escala")

        # dados anteriores aos setores vão para o primeiro setor (ou "Geral")
        setor_id = conn.execute(text("SELECT id FROM setores ORDER BY id LIMIT 1")).scalar()
        if setor_id is None:
            setor_id = conn.execute(
                text("INSERT INTO setores (nome) VALUES (:nome) RETURNING id"),
                {"nome": SETOR_PADRAO},
            ).scalar()

        conn.execute(
            text("UPDATE users SET setor_id = :setor WHERE setor_id IS NULL AND lower(cargo) <> 'coordenador'"),
            {"setor": setor_id},
        )
        conn.execute(
            text("UPDATE escala SET setor_id = :setor WHERE setor_id IS NULL"),
            {"setor": setor_id},
        )
