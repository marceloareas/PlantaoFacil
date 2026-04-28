from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import authController
from core.dependencies import get_current_user
from database import get_db
from models.userModels import User
from schemas.userSchemas import Token, UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return authController.register(db, payload)


# Autentica e devolve um JWT (access_token)
@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return authController.login(db, payload.email, payload.password)


# Retorna o usuário autenticado a partir do token
@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return authController.me(current_user)