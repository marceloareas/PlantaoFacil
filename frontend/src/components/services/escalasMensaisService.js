import { validarTurnosMensais } from "../utils/validarTurnosMensais";
import { api } from "../api/Api";

export const buscarEscalasDoMes = async (
    dataReferencia,
    nome,
    cpf,
    horaEscala
) => {

    const [, mes, ano] = dataReferencia.split("-");

    const escalasMes = await api.get(
        `/escalaMes/?mes=${parseInt(mes)}&ano=${ano}&cpf=${cpf}`
    );

    return validarTurnosMensais(
        escalasMes,
        horaEscala
    );
};

export default buscarEscalasDoMes;