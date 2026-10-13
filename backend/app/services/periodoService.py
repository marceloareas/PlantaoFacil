import calendar
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from models.periodoModels import Periodo

FORMATO_ESCALA = "%d-%m-%Y"
# o servidor roda em UTC; "hoje" e os horários de registro seguem o horário de Brasília
FUSO_HORARIO = ZoneInfo("America/Sao_Paulo")
TURNOS = ("07:00 - 19:00", "19:00 - 07:00")
# 12x36: trabalha dia sim, dia não. 12x60: um dia de trabalho a cada três.
DIAS_DO_CICLO = {"12x36": 2, "12x60": 3}


def agora() -> datetime:
    return datetime.now(FUSO_HORARIO).replace(tzinfo=None)


def hoje() -> date:
    return agora().date()


def data_para_escala(data: date) -> str:
    return data.strftime(FORMATO_ESCALA)


def ler_data(valor: str) -> date:
    """Aceita o formato usado na escala (DD-MM-AAAA) e o ISO (AAAA-MM-DD)."""
    for formato in ("%Y-%m-%d", FORMATO_ESCALA):
        try:
            return datetime.strptime(valor, formato).date()
        except (TypeError, ValueError):
            continue
    raise ValueError(f"Data inválida: {valor}")


def calcular_data_fim(data_inicio: date) -> date:
    """O período termina no dia anterior ao mesmo dia do mês seguinte (ex.: 15/10 a 14/11)."""
    ano = data_inicio.year + data_inicio.month // 12
    mes = data_inicio.month % 12 + 1
    ultimo_dia = calendar.monthrange(ano, mes)[1]
    if data_inicio.day > ultimo_dia:
        # ex.: início em 31/01 vai até o último dia de fevereiro
        return date(ano, mes, ultimo_dia)
    return date(ano, mes, data_inicio.day) - timedelta(days=1)


def serializar_periodo(periodo: Periodo) -> dict:
    dia_atual = hoje()
    return {
        "id": periodo.id,
        "setor_id": periodo.setor_id,
        "data_inicio": periodo.data_inicio.isoformat(),
        "data_fim": periodo.data_fim.isoformat(),
        "escala_gerada_em": periodo.escala_gerada_em.isoformat() if periodo.escala_gerada_em else None,
        "vigente": periodo.data_inicio <= dia_atual <= periodo.data_fim,
    }


def periodo_da_data(db: Session, setor_id: int, data: date) -> Periodo | None:
    return (
        db.query(Periodo)
        .filter(
            Periodo.setor_id == setor_id,
            Periodo.data_inicio <= data,
            Periodo.data_fim >= data,
        )
        .order_by(Periodo.data_inicio.desc())
        .first()
    )


def tipo_novo_plantao(db: Session, setor_id: int, data: date) -> str:
    """Plantão incluído depois que a escala do período foi gerada conta como extra."""
    periodo = periodo_da_data(db, setor_id, data)
    if periodo and periodo.escala_gerada_em:
        return "extra"
    return "regular"
