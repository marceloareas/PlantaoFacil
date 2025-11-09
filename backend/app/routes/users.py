from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.userModels import User
from schemas.userSchemas import UserCreate, UserLogin

router = APIRouter(prefix="/usuario", tags=["Usuários"])
LoginRouter = APIRouter(prefix="/login", tags=["Usuários"])

@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    new_user = User(
        email=user.email,
        password=user.password,
        crm=user.crm,
        cpf=user.cpf,
        nome_completo=user.nome_completo,
        cargo=user.cargo
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Usuário criado com sucesso 🎉", "user_id": new_user.id}


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@LoginRouter.post("/")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first() 
    if not db_user or user.password != db_user.password:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    return {
        "message": "Login realizado com sucesso 🎉",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "nome_completo": db_user.nome_completo,
            "crm": db_user.crm,
            "cpf": db_user.cpf,
            "cargo": db_user.cargo
        }
    }
