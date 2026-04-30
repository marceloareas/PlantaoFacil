from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.userModels import User
from schemas.userSchemas import UserCreate
from services import authService, userService


def register(db: Session, payload: UserCreate) -> dict:
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
        "user": _serialize_user(user),
    }


def me(user: User) -> dict:
    return _serialize_user(user)


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "nome_completo": user.nome_completo,
        "crm": user.crm,
        "cpf": user.cpf,
        "cargo": user.cargo,
        "horaEscala": user.horaEscala,
        "situacao": user.situacao,
    }