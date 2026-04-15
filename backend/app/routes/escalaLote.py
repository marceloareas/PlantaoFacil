from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.escalaDiaModels import Escala
from models.userModels import User
from schemas.escalaLoteSchemas import EscalaLoteSchemas
from fastapi import HTTPException
from datetime import datetime, timedelta
from validators.turnosConsecutivos import verificar_turnos_consecutivos

router = APIRouter(prefix="/escalaLote", tags=["Escala em Lote"])


@router.post("/")
def criar_lote(dados: EscalaLoteSchemas, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == dados.usuario_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    pulos = {
        "12x36": 2, # para cada dia alocado, pula 2 dia (total 3 turnos)
        "24x60": 3, # para cada dia alocado, pula 3 dias (total 5 turnos)
    }

    data_atual = datetime.strptime(dados.data_inicio, "%Y-%m-%d")
    pulo = pulos.get(user.horaEscala, 1)

  
    datas_validas = []

    for _ in range(dados.quantidade_dias):

        data_formatada = data_atual.strftime("%d-%m-%Y")

        #VERIFICA SE USUÁRIO JÁ ESTÁ NO DIA (QUALQUER TURNO)
        existe_usuario = db.query(Escala).filter(
            Escala.DataEscala == data_formatada,
            Escala.Horario == user.horaEscala,
            Escala.Cpf == user.cpf
        ).first()

        if existe_usuario:
            pass

        else:

            DiasConsecutivos = verificar_turnos_consecutivos(
            db,
            user.cpf,
            data_atual,
            dados.horario
        )
            print("Dias consecutivos:", DiasConsecutivos)
            if DiasConsecutivos:
                raise HTTPException(status_code=400, detail=f"Alocação bloqueada para {data_formatada} devido a 3 turnos seguidos")
            
            datas_validas.append(data_formatada)

        data_atual += timedelta(days=pulo)

    for data in datas_validas:
        nova_escala = Escala(
            Cpf=user.cpf,
            Nome=user.nome_completo,
            Cargo=user.cargo,
            DataEscala=data,
            Horario=dados.horario
        )
        db.add(nova_escala)

    db.commit()

    return {
        "message": "Processo finalizado",
    }