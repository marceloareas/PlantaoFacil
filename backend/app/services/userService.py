from sqlalchemy.orm import Session
from core.security import hash_password
from models.userModels import User
from schemas.userSchemas import UserCreate
from validators.user_validations import validar_usuario_existente


def _normalizar_nome(nome: str) -> str:
    return " ".join(nome.split())


def create_user(db: Session, payload: UserCreate) -> User:
    validar_usuario_existente(db, payload)

    novo_usuario = User(
        email=payload.email,
        password=hash_password(payload.password),
        crm=payload.crm,
        cpf=payload.cpf,
        nome_completo=_normalizar_nome(payload.nome_completo),
        cargo=payload.cargo,
        horaEscala=payload.horaEscala,
        situacao="Ativo",
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


def update_user(db: Session, user_id: int, payload: UserCreate) -> User | None:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None

    db_user.email = payload.email
    if payload.password:
        db_user.password = hash_password(payload.password)
    db_user.crm = payload.crm
    db_user.cpf = payload.cpf
    db_user.nome_completo = _normalizar_nome(payload.nome_completo)
    db_user.cargo = payload.cargo
    db_user.horaEscala = payload.horaEscala
    db_user.situacao = payload.situacao

    db.commit()
    db.refresh(db_user)
    return db_user


def list_users(db: Session) -> list[User]:
    return db.query(User).all()