from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from schemas.userSchemas import UserCreate
from services import userService

def list_users(db: Session) -> list[dict]:
    return [
        {
            "id": user.id,
            "email": user.email,
            "nome_completo": user.nome_completo,
            "crm": user.crm,
            "cpf": user.cpf,
            "cargo": user.cargo,
            "horaEscala": user.horaEscala,
            "situacao": user.situacao,
        }
        for user in userService.list_users(db)
    ]

def update_user(db: Session, user_id: int, payload: UserCreate) -> dict:
    db_user = userService.update_user(db, user_id, payload)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return {
        "message": "usuário atualizado com sucesso",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "nome_completo": db_user.nome_completo,
            "crm": db_user.crm,
            "cpf": db_user.cpf,
            "cargo": db_user.cargo,
            "horaEscala": db_user.horaEscala,
            "situacao": db_user.situacao,
        }
    }