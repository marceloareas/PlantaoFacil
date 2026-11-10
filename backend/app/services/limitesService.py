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
# máximo de plantões (regulares + extras) por funcionário em um período, para enfermeiros e técnicos.
# Passar do máximo só gera aviso: os plantões extras continuam podendo ser incluídos.
MAX_PLANTOES_PERIODO = 21


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


def _cpfs_do_setor(db: Session, setor_id: int) -> list[str]:
    return [cpf for (cpf,) in db.query(User.cpf).filter(User.setor_id == setor_id).all()]


def contar_extras(db: Session, periodo: Periodo) -> dict[str, int]:
    """Extras dos funcionários do setor no período, incluindo os feitos emprestados a outros setores."""
    linhas = (
        db.query(Escala.Cpf, Escala.DataEscala)
        .filter(Escala.Cpf.in_(_cpfs_do_setor(db, periodo.setor_id)), Escala.tipo == "extra")
        .all()
    )
    return _contar_no_periodo(linhas, periodo)


def contar_plantoes(db: Session, periodo: Periodo, cpfs=None) -> dict[str, int]:
    """Total de plantões (regulares e extras) de cada funcionário no período, em qualquer setor."""
    if cpfs is None:
        cpfs = _cpfs_do_setor(db, periodo.setor_id)
    linhas = db.query(Escala.Cpf, Escala.DataEscala).filter(Escala.Cpf.in_(list(cpfs))).all()
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
    elif tipo == "plantões":
        mensagem = f"{user.nome_completo} está em {quantidade} plantões no período (máximo permitido: {limite})"
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
    plantoes = contar_plantoes(db, periodo)

    resumo, avisos = [], []
    for user in funcionarios:
        qtd_extras = extras.get(user.cpf, 0)
        qtd_trocas = trocas.get(user.cpf, 0)
        qtd_plantoes = plantoes.get(user.cpf, 0)
        if (user.situacao or "").lower() != "ativo" and not (qtd_extras or qtd_trocas):
            continue
        resumo.append({
            "cpf": user.cpf,
            "nome": user.nome_completo,
            "extras": qtd_extras,
            "trocas": qtd_trocas,
            "plantoes": qtd_plantoes,
        })
        if qtd_extras > setor.max_extras_periodo:
            avisos.append(_aviso(user, "extras", qtd_extras, setor.max_extras_periodo))
        if qtd_trocas > setor.max_trocas_periodo:
            avisos.append(_aviso(user, "trocas", qtd_trocas, setor.max_trocas_periodo))
        if qtd_plantoes > MAX_PLANTOES_PERIODO:
            avisos.append(_aviso(user, "plantões", qtd_plantoes, MAX_PLANTOES_PERIODO))

    return {
        "limites": {
            "max_extras_periodo": setor.max_extras_periodo,
            "max_trocas_periodo": setor.max_trocas_periodo,
            "max_plantoes_periodo": MAX_PLANTOES_PERIODO,
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


def resumo_extras_alocados(db: Session, setor_id: int, cpfs, data: date) -> list[dict]:
    """Para quem acabou de receber plantão extra: total de plantões no período da data."""
    periodo = periodo_da_data(db, setor_id, data)
    cpfs = set(cpfs)
    if not periodo or not cpfs:
        return []

    totais = contar_plantoes(db, periodo, cpfs)
    nomes = dict(db.query(User.cpf, User.nome_completo).filter(User.cpf.in_(list(cpfs))).all())
    return [
        {
            "cpf": cpf,
            "nome": nomes.get(cpf, cpf),
            "plantoes": totais.get(cpf, 0),
            "limite": MAX_PLANTOES_PERIODO,
            "periodo_id": periodo.id,
        }
        for cpf in sorted(cpfs, key=lambda c: nomes.get(c, c))
    ]
