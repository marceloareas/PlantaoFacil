from sqlalchemy import func

from database import SessionLocal
from migrations import preparar_banco
from models.userModels import User
from core.perfis import CARGO_ADMIN
from core.security import hash_password  # sua função de criptografia

EMAIL_PADRAO = "admin@plantaofacil.com"


def garantir_admin():
    preparar_banco()
    db = SessionLocal()

    try:

        admin = db.query(User).filter(
            func.lower(User.cargo) == CARGO_ADMIN.lower(),
            func.lower(User.situacao) == "ativo",
        ).first()

        if admin:
            print("Admin já existe.")
            return

        conta_padrao = db.query(User).filter(User.email == EMAIL_PADRAO).first()

        if conta_padrao:
            # Bancos antigos têm a conta padrão como coordenador.
            conta_padrao.cargo = CARGO_ADMIN
            conta_padrao.situacao = "Ativo"
            conta_padrao.setor_id = None
            conta_padrao.turno = None
            conta_padrao.inicio_ciclo = None
            db.commit()

            print("Conta padrão promovida a Admin.")
        else:
            admin = User(
                nome_completo="Administrador",
                cpf="00000000000",
                email=EMAIL_PADRAO,
                password=hash_password("admin"),
                cargo=CARGO_ADMIN
            )

            db.add(admin)
            db.commit()

            print("Admin criado com sucesso.")

    finally:
        db.close()

if __name__ == "__main__":
    garantir_admin()
