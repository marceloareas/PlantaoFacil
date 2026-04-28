from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import userController
from core.dependencies import get_current_user
from database import get_db
from models.userModels import User
from schemas.userSchemas import UserCreate


router = APIRouter(
    prefix="/users",
    tags=["Usuários"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    return userController.list_users(db)


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserCreate, db: Session = Depends(get_db)):
    return userController.update_user(db, user_id, payload)