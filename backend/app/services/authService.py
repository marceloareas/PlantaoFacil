from typing import Optional
from sqlalchemy.orm import Session
from core.security import create_access_token, verify_password
from models.userModels import User


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def build_token_for_user(user: User) -> str:
    return create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "cargo": user.cargo,
        },
    )