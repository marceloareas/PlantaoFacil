from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.config import settings
from core.security import JWTError, decode_access_token
from database import get_db
from models.setorModels import Setor
from models.userModels import User


# tokenUrl é o endpoint que gera o token — usado pelo Swagger pra exibir
# o botão "Authorize". Aponta para o login REST versionado.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)
oauth2_scheme_opcional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)


def is_coordenador(user: User) -> bool:
    return (user.cargo or "").lower() == "coordenador"


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


def get_optional_user(
    token: str | None = Depends(oauth2_scheme_opcional),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None
    return get_current_user(token, db)


def require_coordenador(current_user: User = Depends(get_current_user)) -> User:
    if not is_coordenador(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas coordenadores podem realizar esta ação",
        )
    return current_user


def get_setor_id(
    x_setor_id: int | None = Header(default=None),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> int:
    """Setor em que a requisição opera: o do funcionário logado, ou o escolhido pelo coordenador."""
    if user and not is_coordenador(user):
        if user.setor_id is None:
            raise HTTPException(status_code=400, detail="Funcionário sem setor definido")
        return user.setor_id

    if x_setor_id is None:
        raise HTTPException(status_code=400, detail="Nenhum setor selecionado")
    if not db.get(Setor, x_setor_id):
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    return x_setor_id
