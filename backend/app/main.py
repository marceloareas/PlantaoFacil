from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.config import settings
from database import engine
from migrations import preparar_banco
from routes import users, escalaDia, funcAusentes, trocas, escalaMes, escalaLote, auth, setores, periodos, avisos, faltas, emprestimos

app = FastAPI(title="Plantão Fácil API")

# origens liberadas vêm da variável CORS_ORIGINS (core/config.py)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

preparar_banco()

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(setores.router)
api_router.include_router(escalaLote.router)
api_router.include_router(users.router)
api_router.include_router(auth.router)
api_router.include_router(escalaDia.router)
api_router.include_router(funcAusentes.router)
api_router.include_router(trocas.router)
api_router.include_router(escalaMes.router)
api_router.include_router(periodos.router)
api_router.include_router(avisos.router)
api_router.include_router(faltas.router)
api_router.include_router(emprestimos.router)


@app.get("/")
@api_router.get("/status")  # mesmo teste, acessível pelo proxy em /api/v1/status
def root():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"message": "API rodando com sucesso e banco conectado 🎯"}
    except OperationalError:
        return {"message": "API rodando com sucesso, mas banco NÃO conectado ❌"}
    except Exception as e:
        return {"message": "Erro inesperado ao conectar ao banco ❌", "detalhes": str(e)}


app.include_router(api_router)
