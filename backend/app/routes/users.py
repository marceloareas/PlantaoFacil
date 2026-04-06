from validators.user_validations import validar_usuario_existente
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.userModels import User
from schemas.userSchemas import UserCreate, UserLogin
import bcrypt

router = APIRouter(prefix="/usuario", tags=["Usuários"])
LoginRouter = APIRouter(prefix="/login", tags=["Usuários"])

def hashsenha(password: str) -> str:            # Função para hash da senha usando bcrypt
    senha_bytes = password.encode('utf-8')
    hash_senha = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())
    return hash_senha.decode('utf-8')

@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):       
    validar_usuario_existente(db, user)
    
    

    new_user = User(
        email=user.email,
        password= hashsenha(user.password),
        crm=user.crm,
        cpf=user.cpf,
        nome_completo=user.nome_completo,
        cargo=user.cargo,
        horaEscala=user.horaEscala,
        situacao="Ativo"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Usuário criado com sucesso 🎉", "user_id": new_user.id}


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "nome_completo": user.nome_completo,
            "crm": user.crm,
            "cpf": user.cpf,
            "cargo": user.cargo,
            "horaEscala": user.horaEscala,
            "situacao": user.situacao
        }
        for user in users
    ]

@router.put("/{user_id}")
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    db_user.email = user.email
    if user.password:
        db_user.password = hashsenha(user.password)
    db_user.crm = user.crm
    db_user.cpf = user.cpf
    db_user.nome_completo = user.nome_completo
    db_user.cargo = user.cargo
    db_user.horaEscala = user.horaEscala
    db_user.situacao = user.situacao

    db.commit()
    db.refresh(db_user)

    return {
        "message": "Usuário atualizado com sucesso",
        "user": db_user
    }

@LoginRouter.post("/")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    verificar_senha = bcrypt.checkpw(user.password.encode('utf-8'), 
                                     db_user.password.encode('utf-8'))
    
    if not verificar_senha:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    return {
        "message": "Login realizado com sucesso ",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "nome_completo": db_user.nome_completo,
            "crm": db_user.crm,
            "cpf": db_user.cpf,
            "cargo": db_user.cargo,
            "horaEscala": db_user.horaEscala,
            "situacao": db_user.situacao
        }
    }
