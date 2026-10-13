from sqlalchemy import inspect, text

from database import Base, engine
from models import setorModels, userModels, escalaDiaModels, funcAusentesModels, trocasModels, periodoModels, faltaModels  # noqa: F401

SETOR_PADRAO = "Geral"

# create_all não adiciona colunas a tabelas que já existem
COLUNAS_NOVAS = {
    "users": {
        "setor_id": "INTEGER REFERENCES setores(id)",
        "turno": "VARCHAR(20)",
        "inicio_ciclo": "DATE",
    },
    "escala": {
        "setor_id": "INTEGER REFERENCES setores(id)",
        "tipo": "VARCHAR(10) NOT NULL DEFAULT 'regular'",
    },
    "setores": {
        "max_extras_periodo": "INTEGER NOT NULL DEFAULT 5",
        "max_trocas_periodo": "INTEGER NOT NULL DEFAULT 5",
    },
    "periodos": {
        "setor_id": "INTEGER REFERENCES setores(id)",
        "escala_gerada_em": "TIMESTAMP",
    },
}


def _adicionar_colunas(conn, tabela: str, colunas: dict) -> None:
    existentes = {c["name"] for c in inspect(conn).get_columns(tabela)}
    for nome, definicao in colunas.items():
        if nome not in existentes:
            conn.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {nome} {definicao}"))


def preparar_banco() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        for tabela, colunas in COLUNAS_NOVAS.items():
            _adicionar_colunas(conn, tabela, colunas)

        # dados anteriores aos setores vão para o primeiro setor (ou "Geral")
        setor_id = conn.execute(text("SELECT id FROM setores ORDER BY id LIMIT 1")).scalar()
        if setor_id is None:
            setor_id = conn.execute(
                text("INSERT INTO setores (nome) VALUES (:nome) RETURNING id"),
                {"nome": SETOR_PADRAO},
            ).scalar()

        conn.execute(
            text("UPDATE users SET setor_id = :setor WHERE setor_id IS NULL AND lower(cargo) NOT IN ('coordenador', 'admin')"),
            {"setor": setor_id},
        )
        for tabela in ("escala", "periodos"):
            conn.execute(
                text(f"UPDATE {tabela} SET setor_id = :setor WHERE setor_id IS NULL"),
                {"setor": setor_id},
            )
