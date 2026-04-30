from fastapi import HTTPException
from models.userModels import User

def validar_usuario_existente(db, user):
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="E-mail já foi cadastrado")

    existing_cpf = db.query(User).filter(User.cpf == user.cpf).first()
    if existing_cpf:
        raise HTTPException(status_code=400, detail="CPF já foi cadastrado")

    existing_crm = db.query(User).filter(User.crm == user.crm).first()
    if existing_crm:
        raise HTTPException(status_code=400, detail="CRM já foi cadastrado")