from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.config import settings
from core.security import JWTError, decode_access_token
from database import get_db
from models.userModels import User


# tokenUrl é o endpoint que gera o token — usado pelo Swagger pra exibir
# o botão "Authorize". Aponta para o login REST versionado.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Valida o token JWT e retorna o usuário correspondente."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id_raw: str | None = payload.get("sub")
        if user_id_raw is None:
            raise credentials_exception
        user_id = int(user_id_raw)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if user.situacao and user.situacao.lower() != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    return user