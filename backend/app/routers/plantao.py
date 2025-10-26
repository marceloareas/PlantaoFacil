from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.models import Plantao
from app.schemas.schemas import PlantaoCreate, PlantaoRead

router = APIRouter(prefix="/plantoes", tags=["Plantoes"])

@router.get("/", response_model=list[PlantaoRead])
async def listar_plantoes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plantao))
    return result.scalars().all()

@router.get("/{plantao_id}", response_model=PlantaoRead)
async def obter_plantao(plantao_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plantao).where(Plantao.id == plantao_id))
    plantao = result.scalar_one_or_none()
    if not plantao:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    return plantao

@router.post("/", response_model=PlantaoRead)
async def criar_plantao(plantao: PlantaoCreate, db: AsyncSession = Depends(get_db)):
    novo = Plantao(**plantao.dict())
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    return novo

@router.put("/{plantao_id}", response_model=PlantaoRead)
async def atualizar_plantao(plantao_id: int, plantao: PlantaoCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plantao).where(Plantao.id == plantao_id))
    existente = result.scalar_one_or_none()
    if not existente:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    for key, value in plantao.dict().items():
        setattr(existente, key, value)
    await db.commit()
    await db.refresh(existente)
    return existente

@router.delete("/{plantao_id}")
async def deletar_plantao(plantao_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plantao).where(Plantao.id == plantao_id))
    plantao = result.scalar_one_or_none()
    if not plantao:
        raise HTTPException(status_code=404, detail="Plantão não encontrado")
    await db.delete(plantao)
    await db.commit()
    return {"detail": "Plantão removido com sucesso"}
