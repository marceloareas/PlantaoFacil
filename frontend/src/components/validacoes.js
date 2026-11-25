export const validarCpf = (cpf) => {
    let valor = cpf.replace(/\D/g, "");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return valor;
};

export const validarCoren = (coren) => {
    const value = coren.trim().toUpperCase();
    const regex = /^[0-9]{4,6}-[A-Za-z]{2}\/[A-Za-z]{2,4}$/;

    if (!regex.test(value)) {
        return {
            valido: false,
            mensagem: "Formato inválido! Use o padrão: XXXXXX-YY/ZZZ"
        };
    }

    return { valido: true };
};

export const validarCamposObrigatorios = (campos) => {
    for (const [key, value] of Object.entries(campos)) {
        if (!value) return `O campo ${key} é obrigatório.`;
    }
    return null;
};
