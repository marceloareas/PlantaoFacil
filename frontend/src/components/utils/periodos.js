const doisDigitos = (n) => String(n).padStart(2, "0");

const paraISO = (data) =>
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

const lerISO = (iso) => {
    const [ano, mes, dia] = (iso || "").split("-").map(Number);
    if (!ano || !mes || !dia) return null;
    return { ano, mes, dia };
};

export const hojeISO = () => paraISO(new Date());

export const diaSeguinteISO = (iso) => {
    const data = lerISO(iso);
    if (!data) return "";
    return paraISO(new Date(data.ano, data.mes - 1, data.dia + 1));
};

export const diaAnteriorISO = (iso) => {
    const data = lerISO(iso);
    if (!data) return "";
    return paraISO(new Date(data.ano, data.mes - 1, data.dia - 1));
};

// trechos sem período entre o novo período e os vizinhos já cadastrados
export const diasSemPeriodo = (periodos, inicioISO, fimISO) => {
    const trechos = [];
    if (!inicioISO || !fimISO) return trechos;

    const fimAnterior = periodos
        .filter((p) => p.data_fim < inicioISO)
        .reduce((maior, p) => (p.data_fim > maior ? p.data_fim : maior), "");
    if (fimAnterior) {
        const primeiroDia = diaSeguinteISO(fimAnterior);
        if (primeiroDia < inicioISO) trechos.push({ inicio: primeiroDia, fim: diaAnteriorISO(inicioISO) });
    }

    const inicioPosterior = periodos
        .filter((p) => p.data_inicio > fimISO)
        .reduce((menor, p) => (!menor || p.data_inicio < menor ? p.data_inicio : menor), "");
    if (inicioPosterior) {
        const primeiroDia = diaSeguinteISO(fimISO);
        if (primeiroDia < inicioPosterior) trechos.push({ inicio: primeiroDia, fim: diaAnteriorISO(inicioPosterior) });
    }

    return trechos;
};

// mesma regra do backend (calcular_data_fim): termina no dia anterior ao mesmo dia do mês seguinte
export const calcularDataFim = (inicioISO) => {
    const inicio = lerISO(inicioISO);
    if (!inicio) return "";
    const ano = inicio.ano + Math.floor(inicio.mes / 12);
    const mes = (inicio.mes % 12) + 1;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    if (inicio.dia > ultimoDia) {
        // ex.: início em 31/01 vai até o último dia de fevereiro
        return paraISO(new Date(ano, mes - 1, ultimoDia));
    }
    return paraISO(new Date(ano, mes - 1, inicio.dia - 1));
};

// "AAAA-MM-DD" (ou datetime ISO) para "dd/mm/aaaa"
export const formatarData = (iso) => {
    const data = lerISO((iso || "").slice(0, 10));
    if (!data) return iso || "";
    return `${doisDigitos(data.dia)}/${doisDigitos(data.mes)}/${data.ano}`;
};

// "AAAA-MM-DDTHH:MM:SS" para "dd/mm/aaaa às HH:MM", sem conversão de fuso
export const formatarDataHora = (iso) => {
    const partes = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso || "");
    if (!partes) return formatarData(iso);
    const [, ano, mes, dia, hora, minuto] = partes;
    return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
};

// datas da escala vêm como "DD-MM-AAAA"
export const formatarDataEscala = (data) => (data || "").replace(/-/g, "/");

export const descreverPeriodo = (periodo) =>
    periodo ? `${formatarData(periodo.data_inicio)} a ${formatarData(periodo.data_fim)}` : "";
