from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Cargo, Usuario, Plantao

# ----- Cargo -----
async def get_cargos(db: AsyncSession):
    result = await db.execute(select(Cargo))
    return result.scalars().all()

async def create_cargo(db: AsyncSession, cargo: Cargo):
    db.add(cargo)
    await db.commit()
    await db.refresh(cargo)
    return cargo


# ----- Usuario -----
async def get_usuarios(db: AsyncSession):
    result = await db.execute(select(Usuario))
    return result.scalars().all()

async def create_usuario(db: AsyncSession, usuario: Usuario):
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


# ----- Plantao -----
async def get_plantoes(db: AsyncSession):
    result = await db.execute(select(Plantao))
    return result.scalars().all()

async def create_plantao(db: AsyncSession, plantao: Plantao):
    db.add(plantao)
    await db.commit()
    await db.refresh(plantao)
    return plantao
