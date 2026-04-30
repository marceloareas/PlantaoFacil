import { validarTurnosMensais } from "../utils/validarTurnosMensais";
import { api } from "../api/Api";

export const buscarEscalasDoMes = async (
    dataReferencia,
    nome,
    cpf,
    horaEscala
) => {
    const [, mes, ano] = dataReferencia.split("-");
    const escalas = [];

    const ultimoDia = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const data = `${String(dia).padStart(2, "0")}-${mes}-${ano}`;

        try {
            const json = await api.get(`/escaladodia/${data}`);
            escalas.push({
                data,
                Escala: json.Escala || [],
            });
        } catch {
            continue;
        }
    }

    return validarTurnosMensais(escalas, nome, cpf, horaEscala);
};

export default buscarEscalasDoMes;
