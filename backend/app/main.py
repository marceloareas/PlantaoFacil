from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import usuario, cargo, plantao

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executa no STARTUP
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Banco sincronizado com sucesso!")

    yield  # ⬅️ aqui o app fica rodando normalmente

    # Executa no SHUTDOWN
    await engine.dispose()
    print("Conexão com o banco encerrada.")

app = FastAPI(title="API PlantãoFácil", lifespan=lifespan)

# Routers
app.include_router(usuario.router)
app.include_router(cargo.router)
app.include_router(plantao.router)
