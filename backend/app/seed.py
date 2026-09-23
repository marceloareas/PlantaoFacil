from database import SessionLocal
from migrations import preparar_banco
from models.userModels import User
from core.security import hash_password  # sua função de criptografia

def criar_coordenador():
    preparar_banco()
    db = SessionLocal()

    try:

        coordenador = db.query(User).filter(
            User.cargo == "Coordenador"
        ).first()

        if not coordenador:
            coordenador = User(
                nome_completo="Administrador",
                cpf="00000000000",
                email="admin@plantaofacil.com",
                password=hash_password("admin"),
                cargo="Coordenador"
            )

            db.add(coordenador)
            db.commit()

            print("Coordenador criado com sucesso.")
        else:
            print("Coordenador já existe.")

    finally:
        db.close()

if __name__ == "__main__":
    criar_coordenador()