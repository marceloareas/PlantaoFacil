from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine, Base
from routes import users, escalaDia, funcAusentes, trocas, escalaMes

app = FastAPI(title="Plantão Fácil API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(users.router)
app.include_router(users.LoginRouter)
app.include_router(escalaDia.router)
app.include_router(funcAusentes.router)
app.include_router(trocas.router)
app.include_router(escalaMes.router)


@app.get("/")
def root():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"message": "API rodando com sucesso e banco conectado 🎯"}
    except OperationalError:
        return {"message": "API rodando com sucesso, mas banco NÃO conectado ❌"}
    except Exception as e:
        return {"message": "Erro inesperado ao conectar ao banco ❌", "detalhes": str(e)}
