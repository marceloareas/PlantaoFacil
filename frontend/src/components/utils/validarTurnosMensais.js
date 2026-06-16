/**
 * @param {Array} escalasMes 
 * @param {string} horaEscala
 */
export const validarTurnosMensais = (
    escalasMes,
    horaEscala
) => {

    const totalTurnos = escalasMes.filter(
        (dia) => dia.escalado
    ).length;

    const regime = horaEscala?.toUpperCase();

    const limitesPorRegime = {
        "12X36": 20,
        "12X60": 15,
    };

    const limite = limitesPorRegime[regime] ?? 10;

    return {
        totalTurnos,
        excedeuLimite: totalTurnos + 1 > limite,
        limite,
    };
};

export default validarTurnosMensais;

