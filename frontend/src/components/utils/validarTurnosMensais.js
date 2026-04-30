/**
 * @param {Array} escalasMes 
 * @param {string} nome
 * @param {string} cpf
 * @param {string} horaEscala
 */
export const validarTurnosMensais = (
    escalasMes,
    nome,
    cpf,
    horaEscala
) => {
    let totalTurnos = 0;

    escalasMes.forEach((dia) => {
        const escala = dia.Escala || [];

        escala.forEach((item) => {
            if (item.Nome === nome && item.Cpf === cpf) {
                totalTurnos++;
            }
        });
    });

    const regime = horaEscala?.toUpperCase();

    //+5 por turnos extras permitidos
    const limitesPorRegime = {
        "12X36": 15+5,
        "12X60": 10+5,
    };

    const limite = limitesPorRegime[regime] ?? 10; 

    console.log(`Total de turnos para ${nome} (${cpf}): ${totalTurnos}. Limite para regime ${regime}: ${limite}.`);
    return {
        totalTurnos,
        excedeuLimite: totalTurnos + 1 > limite,
        limite,
    };
};
