from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from core.config import settings


# ---------- Senhas ----------

def hash_password(plain_password: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    senha_bytes = plain_password.encode("utf-8")
    hash_bytes = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hash_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Confere senha em texto puro contra um hash bcrypt salvo no banco."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


# ---------- JWT ----------

def create_access_token(
    subject: str | int,
    extra_claims: Optional[dict] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    """
    Cria um JWT assinado.

    `subject` deve identificar unicamente o usuário (geralmente o id).
    `extra_claims` é qualquer informação extra a ser embutida (ex.: cargo, email).
    """
    expires_delta = timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    expire_at = datetime.now(timezone.utc) + expires_delta

    to_encode: dict = {
        "sub": str(subject),
        "exp": expire_at,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }

    if extra_claims:
        to_encode.update(extra_claims)

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodifica e valida o JWT. Levanta JWTError se for inválido/expirado.
    Retorna o payload do token.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "JWTError",
]