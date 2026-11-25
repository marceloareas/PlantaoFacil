from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from controllers.userController import serializar_usuario
from core.perfis import is_admin, is_cargo_gestao
from models.userModels import User
from schemas.userSchemas import UserCreate
from services import authService, userService


def register(db: Session, payload: UserCreate, current_user: User) -> dict:
    if is_cargo_gestao(payload.cargo) and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem cadastrar coordenadores e administradores",
        )

    novo_usuario = userService.create_user(db, payload)
    return {
        "message": "Usuário criado com sucesso!",
        "user_id": novo_usuario.id,
    }


def login(db: Session, email: str, password: str) -> dict:
    user = authService.authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos!",
        )

    access_token = authService.build_token_for_user(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serializar_usuario(user),
    }


def me(user: User) -> dict:
    return serializar_usuario(user)
