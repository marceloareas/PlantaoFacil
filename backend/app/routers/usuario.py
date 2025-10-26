from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.models import Usuario
from app.schemas.schemas import UsuarioCreate, UsuarioRead

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UsuarioRead])
async def listar_usuarios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario))
    return result.scalars().all()

@router.get("/{usuario_id}", response_model=UsuarioRead)
async def obter_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario

@router.post("/", response_model=UsuarioRead)
async def criar_usuario(usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    novo = Usuario(**usuario.dict())
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    return novo

@router.put("/{usuario_id}", response_model=UsuarioRead)
async def atualizar_usuario(usuario_id: int, usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    existente = result.scalar_one_or_none()
    if not existente:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    for key, value in usuario.dict().items():
        setattr(existente, key, value)
    await db.commit()
    await db.refresh(existente)
    return existente

@router.delete("/{usuario_id}")
async def deletar_usuario(usuario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.delete(usuario)
    await db.commit()
    return {"detail": "Usuário removido com sucesso"}
