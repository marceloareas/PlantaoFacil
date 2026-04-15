from datetime import datetime, timedelta
from models.escalaDiaModels import Escala


def verificar_turnos_consecutivos(db, cpf, nova_data, novo_horario):

    escalas = db.query(Escala).filter(
        Escala.Cpf == cpf
    ).all()

    turnos = []

    def gerar_indice(data, horario):
        base = data.toordinal() * 2
        if horario == "07:00 - 19:00":
            return base
        else:
            return base + 1

    # existentes
    for e in escalas:
        data = datetime.strptime(e.DataEscala, "%d-%m-%Y")
        if abs((data - nova_data).days) <= 3:
         turnos.append(gerar_indice(data, e.Horario))


    turnos.append(gerar_indice(nova_data, novo_horario))

    turnos = sorted(set(turnos))

    contador = 1

    for i in range(1, len(turnos)):
        if turnos[i] - turnos[i-1] == 1:
            contador += 1
            if contador >= 3:
                return True
        else:
            contador = 1

    return False