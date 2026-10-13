from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.perfis import is_admin, is_cargo_gestao
from models.userModels import User
from schemas.userSchemas import UserUpdate
from services import userService


def serializar_usuario(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "nome_completo": user.nome_completo,
        "crm": user.crm,
        "cpf": user.cpf,
        "cargo": user.cargo,
        "horaEscala": user.horaEscala,
        "situacao": user.situacao,
        "setor_id": user.setor_id,
        "setor_nome": user.setor.nome if user.setor else None,
        "turno": user.turno,
        "inicio_ciclo": user.inicio_ciclo.isoformat() if user.inicio_ciclo else None,
    }


def list_users(db: Session) -> list[dict]:
    return [serializar_usuario(user) for user in userService.list_users(db)]


def _mesmo_cargo(atual: str | None, novo: str | None) -> bool:
    return (atual or "").strip().lower() == (novo or "").strip().lower()


def update_user(db: Session, user_id: int, payload: UserUpdate, current_user: User) -> dict:
    db_user = userService.get_user(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    envolve_gestao = is_cargo_gestao(db_user.cargo) or is_cargo_gestao(payload.cargo)
    if envolve_gestao and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem alterar coordenadores e administradores",
        )
    if db_user.id == current_user.id and not _mesmo_cargo(db_user.cargo, payload.cargo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode alterar o seu próprio cargo",
        )
    if db_user.id == current_user.id and (payload.situacao or "").strip().lower() != "ativo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode desativar a sua própria conta",
        )

    db_user = userService.update_user(db, user_id, payload)
    return {
        "message": "usuário atualizado com sucesso",
        "user": serializar_usuario(db_user),
    }
