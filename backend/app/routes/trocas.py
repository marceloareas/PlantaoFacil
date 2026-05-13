from validators.turnosConsecutivos import verificar_turnos_consecutivos
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.trocasModels import Troca
from schemas.trocasSchemas import TrocaCreate, TrocaResponse, TrocaUpdate
from typing import List
from models.escalaDiaModels import Escala
from datetime import datetime


router = APIRouter(prefix="/trocas", tags=["Trocas"])


def converter_data(data_iso: str) -> str:
    try:
        return datetime.strptime(data_iso, "%Y-%m-%d").strftime("%d-%m-%Y")
    except:
        return data_iso 
    

def troca_response(troca: Troca):
    return {
        "id": troca.id,
        "cpfSolicitante": troca.cpfSolicitante,
        "cpfDestinatario": troca.cpfDestinatario,
        "meudia": troca.meudia,
        "horariosolicitante": troca.horariosolicitante,
        "diacolega": troca.diacolega,
        "horariodestinatario": troca.horariodestinatario,
        "motivo": troca.motivo,
        "situacao": troca.situacao,

        "nomeSolicitante":
            troca.solicitante_user.nome_completo
            if troca.solicitante_user else "",

        "nomeDestinatario":
            troca.destinatario_user.nome_completo
            if troca.destinatario_user else ""
    }

def validar_troca(db,cpf_solicitante,cpf_destinatario,data_solicitante,horario_solicitante,
    data_destinatario,
    horario_destinatario
):

    data_solicitante_dt = datetime.strptime(data_solicitante,"%d-%m-%Y")

    data_destinatario_dt = datetime.strptime(  data_destinatario,"%d-%m-%Y")
    solicitante_invalido = verificar_turnos_consecutivos(db=db,cpf=cpf_solicitante,nova_data=data_destinatario_dt,
        novo_horario=horario_destinatario,
        remover_data=data_solicitante_dt,
        remover_horario=horario_solicitante
    )

    destinatario_invalido = verificar_turnos_consecutivos(db=db,cpf=cpf_destinatario,nova_data=data_solicitante_dt,
        novo_horario=horario_solicitante,
        remover_data=data_destinatario_dt,
        remover_horario=horario_destinatario
    )

    if solicitante_invalido:
        raise HTTPException(status_code=400,detail="Troca inválida: solicitante ficaria com 3 plantões consecutivos"       )
    if destinatario_invalido:
        raise HTTPException(status_code=400, detail="Troca inválida: destinatário ficaria com 3 plantões consecutivos"        )


@router.post("/", response_model=TrocaResponse)
def criar_troca(troca: TrocaCreate, db: Session = Depends(get_db)):

    validar_troca(
        db=db,
        cpf_solicitante=troca.cpfSolicitante,
        cpf_destinatario=troca.cpfDestinatario,
        data_solicitante=converter_data(troca.meudia),
        horario_solicitante=troca.horariosolicitante,
        data_destinatario=converter_data(troca.diacolega),
        horario_destinatario=troca.horariodestinatario
    )

    nova_troca = Troca(
        cpfSolicitante=troca.cpfSolicitante,
        cpfDestinatario=troca.cpfDestinatario,
        meudia=troca.meudia,
        horariosolicitante=troca.horariosolicitante,
        diacolega=troca.diacolega,
        horariodestinatario=troca.horariodestinatario,
        motivo=troca.motivo,
        situacao=troca.situacao or "Aguardando Destinatario"
    )
    db.add(nova_troca)
    db.commit()
    db.refresh(nova_troca)

    return troca_response(nova_troca)


@router.put("/{troca_id}", response_model=TrocaResponse)
def editar_troca(troca_id: int, dados: TrocaUpdate, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao not in ["Pendente", "Aguardando Destinatario"]:
        raise HTTPException(
            status_code=400,
            detail="Só é possível editar trocas em situação Pendente ou Aguardando Destinatario"
        )
    


    troca.cpfDestinatario = dados.cpfDestinatario
    troca.meudia = dados.meudia
    troca.horariosolicitante = dados.horariosolicitante
    troca.diacolega = dados.diacolega
    troca.horariodestinatario = dados.horariodestinatario
    troca.motivo = dados.motivo

    troca.situacao = "Aguardando Destinatario"

    db.commit()
    db.refresh(troca)

    return troca_response(troca)


@router.put("/{troca_id}/destinatario-aprovar", response_model=TrocaResponse)
def destinatario_aprovar(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aguardando Destinatario":
        raise HTTPException(status_code=400, detail="Troca não está aguardando o destinatário")

    troca.situacao = "Pendente"
    db.commit()
    db.refresh(troca)
    return troca_response(troca)


@router.put("/{troca_id}/destinatario-rejeitar", response_model=TrocaResponse)
def destinatario_rejeitar(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aguardando Destinatario":
        raise HTTPException(status_code=400, detail="Troca não está aguardando o destinatário")

    troca.situacao = "Rejeitada Pelo Destinatario"
    db.commit()
    db.refresh(troca)
    return troca_response(troca)


@router.get("/", response_model=List[TrocaResponse])
def listar_trocas(
    cpfSolicitante: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Troca)

    if cpfSolicitante:
        query = query.filter(
            Troca.cpfSolicitante == cpfSolicitante
        )

    trocas = query.order_by(Troca.id.desc()).all()

    return [troca_response(troca) for troca in trocas]



@router.put("/{troca_id}/aprovar", response_model=TrocaResponse)
def aprovar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao not in ["Pendente", "Desfeita"]:
        raise HTTPException(status_code=400, detail="Esta troca já foi finalizada")

    data_solicitante = converter_data(troca.meudia)
    data_destinatario = converter_data(troca.diacolega)

    escala_solicitante = db.query(Escala).filter(
        Escala.DataEscala == data_solicitante,
        Escala.Horario == troca.horariosolicitante,
        Escala.Cpf == troca.cpfSolicitante
    ).first()

    if not escala_solicitante:
        raise HTTPException(status_code=404, detail="Escala do solicitante não encontrada")

    escala_destinatario = db.query(Escala).filter(
        Escala.DataEscala == data_destinatario,
        Escala.Horario == troca.horariodestinatario,
        Escala.Cpf == troca.cpfDestinatario
    ).first()

    if not escala_destinatario:
        raise HTTPException(status_code=404, detail="Escala do destinatário não encontrada")
    
    validar_troca(
        db=db,
        cpf_solicitante=troca.cpfSolicitante,
        cpf_destinatario=troca.cpfDestinatario,
        data_solicitante=converter_data(troca.meudia),
        horario_solicitante=troca.horariosolicitante,
        data_destinatario=converter_data(troca.diacolega),
        horario_destinatario=troca.horariodestinatario
    )   

    escala_solicitante.cpf = troca.cpfDestinatario
    escala_destinatario.cpf = troca.cpfSolicitante

    escala_solicitante.Nome = troca.destinatario_user.nome_completo
    escala_destinatario.Nome = troca.solicitante_user.nome_completo

    troca.situacao = "Aprovada"

    db.commit()
    db.refresh(troca)
    return troca_response(troca)


@router.put("/{troca_id}/rejeitar", response_model=TrocaResponse)
def rejeitar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()
    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")
    troca.situacao = "Rejeitada"
    db.commit()
    db.refresh(troca)
    return troca_response(troca)


# =================== DELETE AJUSTADO ===================
@router.delete("/{troca_id}")
def deletar_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    # Agora permite deletar Pendente ou Aguardando Destinatario
    if troca.situacao not in ["Pendente", "Aguardando Destinatario"]:
        raise HTTPException(
            status_code=400,
            detail="Só é possível deletar trocas com situação Pendente ou Aguardando Destinatario"
        )

    db.delete(troca)
    db.commit()
    return {"detail": "Troca deletada com sucesso"}


@router.put("/{troca_id}/desfazer", response_model=TrocaResponse)
def desfazer_troca(troca_id: int, db: Session = Depends(get_db)):
    troca = db.query(Troca).filter(Troca.id == troca_id).first()

    if not troca:
        raise HTTPException(status_code=404, detail="Troca não encontrada")

    if troca.situacao != "Aprovada":
        raise HTTPException(
            status_code=400,
            detail="Só é possível desfazer trocas já aprovadas"
        )

    data_solicitante = converter_data(troca.meudia)
    data_destinatario = converter_data(troca.diacolega)

    escala_solicitante = db.query(Escala).filter(
        Escala.DataEscala == data_solicitante,
        Escala.Horario == troca.horariosolicitante
    ).first()

    escala_destinatario = db.query(Escala).filter(
        Escala.DataEscala == data_destinatario,
        Escala.Horario == troca.horariodestinatario
    ).first()

    escala_solicitante.Cpf = troca.cpfSolicitante
    escala_destinatario.Cpf = troca.cpfDestinatario

    escala_solicitante.Nome = troca.solicitante_user.nome_completo
    escala_destinatario.Nome = troca.destinatario_user.nome_completo

    troca.situacao = "Desfeita"

    db.commit()
    db.refresh(troca)
    return troca_response(troca)
