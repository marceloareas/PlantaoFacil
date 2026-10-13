from datetime import date

from sqlalchemy.orm import Session

from core.perfis import is_cargo_gestao
from models.escalaDiaModels import Escala
from models.periodoModels import Periodo
from models.setorModels import Setor
from models.trocasModels import Troca
from models.userModels import User
from services.periodoService import ler_data, periodo_da_data

# trocas recusadas não contam para o limite
SITUACOES_TROCA_CONTADAS = ("Aguardando Destinatario", "Pendente", "Aprovada")


def _contar_no_periodo(linhas, periodo: Periodo) -> dict[str, int]:
    contagem: dict[str, int] = {}
    for cpf, data_str in linhas:
        try:
            data = ler_data(data_str)
        except ValueError:
            continue
        if periodo.data_inicio <= data <= periodo.data_fim:
            contagem[cpf] = contagem.get(cpf, 0) + 1
    return contagem


def contar_extras(db: Session, periodo: Periodo) -> dict[str, int]:
    linhas = (
        db.query(Escala.Cpf, Escala.DataEscala)
        .filter(Escala.setor_id == periodo.setor_id, Escala.tipo == "extra")
        .all()
    )
    return _contar_no_periodo(linhas, periodo)


def contar_trocas(db: Session, periodo: Periodo) -> dict[str, int]:
    linhas = (
        db.query(Troca.cpfSolicitante, Troca.meudia)
        .join(User, Troca.cpfSolicitante == User.cpf)
        .filter(
            User.setor_id == periodo.setor_id,
            Troca.situacao.in_(SITUACOES_TROCA_CONTADAS),
        )
        .all()
    )
    return _contar_no_periodo(linhas, periodo)


def _aviso(user: User, tipo: str, quantidade: int, limite: int) -> dict:
    if tipo == "extras":
        mensagem = f"{user.nome_completo} tem {quantidade} plantões extras no período (limite: {limite})"
    else:
        mensagem = f"{user.nome_completo} solicitou {quantidade} trocas no período (limite: {limite})"
    return {
        "cpf": user.cpf,
        "nome": user.nome_completo,
        "tipo": tipo,
        "quantidade": quantidade,
        "limite": limite,
        "mensagem": mensagem,
    }


def situacao_do_periodo(db: Session, periodo: Periodo) -> dict:
    setor = db.get(Setor, periodo.setor_id)
    funcionarios = [
        u
        for u in db.query(User).filter(User.setor_id == periodo.setor_id).order_by(User.nome_completo).all()
        if not is_cargo_gestao(u.cargo)
    ]
    extras = contar_extras(db, periodo)
    trocas = contar_trocas(db, periodo)

    resumo, avisos = [], []
    for user in funcionarios:
        qtd_extras = extras.get(user.cpf, 0)
        qtd_trocas = trocas.get(user.cpf, 0)
        if (user.situacao or "").lower() != "ativo" and not (qtd_extras or qtd_trocas):
            continue
        resumo.append({
            "cpf": user.cpf,
            "nome": user.nome_completo,
            "extras": qtd_extras,
            "trocas": qtd_trocas,
        })
        if qtd_extras > setor.max_extras_periodo:
            avisos.append(_aviso(user, "extras", qtd_extras, setor.max_extras_periodo))
        if qtd_trocas > setor.max_trocas_periodo:
            avisos.append(_aviso(user, "trocas", qtd_trocas, setor.max_trocas_periodo))

    return {
        "limites": {
            "max_extras_periodo": setor.max_extras_periodo,
            "max_trocas_periodo": setor.max_trocas_periodo,
        },
        "funcionarios": resumo,
        "avisos": avisos,
    }


def avisos_para(db: Session, setor_id: int, cpfs, data: date) -> list[dict]:
    """Avisos de limite dos funcionários informados, no período que contém a data."""
    periodo = periodo_da_data(db, setor_id, data)
    if not periodo:
        return []
    cpfs = set(cpfs)
    return [a for a in situacao_do_periodo(db, periodo)["avisos"] if a["cpf"] in cpfs]
