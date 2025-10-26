from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.models import Cargo
from app.schemas.schemas import CargoCreate, CargoRead

router = APIRouter(prefix="/cargos", tags=["Cargos"])

@router.get("/", response_model=list[CargoRead])
async def listar_cargos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cargo))
    return result.scalars().all()

@router.get("/{cargo_id}", response_model=CargoRead)
async def obter_cargo(cargo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cargo).where(Cargo.id == cargo_id))
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    return cargo

@router.post("/", response_model=CargoRead)
async def criar_cargo(cargo: CargoCreate, db: AsyncSession = Depends(get_db)):
    novo = Cargo(**cargo.dict())
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    return novo

@router.put("/{cargo_id}", response_model=CargoRead)
async def atualizar_cargo(cargo_id: int, cargo: CargoCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cargo).where(Cargo.id == cargo_id))
    existente = result.scalar_one_or_none()
    if not existente:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    for key, value in cargo.dict().items():
        setattr(existente, key, value)
    await db.commit()
    await db.refresh(existente)
    return existente

@router.delete("/{cargo_id}")
async def deletar_cargo(cargo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cargo).where(Cargo.id == cargo_id))
    cargo = result.scalar_one_or_none()
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    await db.delete(cargo)
    await db.commit()
    return {"detail": "Cargo removido com sucesso"}
