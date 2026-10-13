from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import userController
from core.dependencies import get_current_user, require_coordenador
from database import get_db
from models.userModels import User
from schemas.userSchemas import UserUpdate


router = APIRouter(
    prefix="/users",
    tags=["Usuários"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    return userController.list_users(db)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordenador),
):
    return userController.update_user(db, user_id, payload, current_user)
