import { useNavigate } from "react-router-dom";
import { useEffect, useState, React } from "react";
import "./EscalaDaSemana.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { api } from "../../components/api/Api";

const EscalaDaSemana = () => {
    const navigate = useNavigate();

    const usuarioLogado = { cargo: "Coordenador" }; 
    const isCoordenador = usuarioLogado?.cargo === "Coordenador";

    const [dataReferencia, setDataReferencia] = useState(new Date());
    const [diasSemana, setDiasSemana] = useState([]);
    const [escalas, setEscalas] = useState({});
    const [cargos, setCargos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [semanaCopiada, setSemanaCopiada] = useState(null);

    const [trocasAprovadas, setTrocasAprovadas] = useState([]);
    const [modalInfo, setModalInfo] = useState(null);
    
    
    
    const copiarSemanaAtual = async () => {
        try {
            const dadosSemana = [];

            const inicio = diasSemana[0].data;
            const fim = diasSemana[diasSemana.length - 1].data;

            for (const dia of diasSemana) {
                const response = await api.get(`/escaladodia/${dia.data}`);
                dadosSemana.push({
                    dataOrigem: dia.data,
                    escala: response.Escala || []
                });
            }

            setSemanaCopiada(dadosSemana);

            alert("Semana copiada com sucesso!");

        } catch (err) {
            console.error(err);
            alert("Erro ao copiar semana");
        }
    };

    const colarSemana = async () => {

        if (!semanaCopiada) {
            alert("Nenhuma semana copiada");
            return;
        }

        try {

            // verifica se semana atual está vazia
            let semanaVazia = true;

            for (const dia of diasSemana) {
                try {
                    const data = await api.get(`/escaladodia/${dia.data}`);

                    if (data.Escala && data.Escala.length > 0) {
                        semanaVazia = false;
                        break;
                    }
                } catch (err) {
                    continue; // se der erro, considera dia vazio
                }
            }

            if (!semanaVazia) {
                alert("Erro: A semana destino não está vazia");
                return;
            }

            // copia os dias
            for (let i = 0; i < 7; i++) {

                const diaDestino = diasSemana[i]?.data;
                if (!diaDestino) continue;

                const escalasOrigem = semanaCopiada[i]?.escala || [];

                

                for (const item of escalasOrigem) {

                    await api.post(`/escaladodia/${diaDestino}`, {
                        DataEscala: diaDestino,
                        Escala:[
                            {
                                Horario: item.Horario,
                                Nome: item.Nome,
                                Cargo: item.Cargo,
                                Cpf: item.Cpf}
                            ]
                    });
                }
            }

            alert("Semana colada com sucesso!");

            gerarDiasDaSemana(dataReferencia);

        } catch (err) {
            console.error(err);
            alert("Erro ao colar semana");
        }
    };


    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    useEffect(() => {
        api.get("/users/")
            .then(setUsuarios)
            .catch(err => console.error("Erro usuários:", err));
    }, []);

    const isUsuarioDesativado = (nome) =>
        usuarios.some(
            u => u.nome_completo === nome && u.situacao === "Desativado"
        );

    useEffect(() => {
        api.get("/trocas/")
            .then(data => setTrocasAprovadas(data.filter(t => t.situacao === "Aprovada")))
            .catch(err => console.error("Erro trocas:", err));
    }, []);

    useEffect(() => {
        gerarDiasDaSemana(dataReferencia);
    }, [dataReferencia]);

    const gerarDiasDaSemana = async (referencia) => {
        const dias = [];

        const diaDaSemana = referencia.getDay();

        const primeiroDiaDaSemana = new Date(referencia);
        primeiroDiaDaSemana.setDate(referencia.getDate() - diaDaSemana);

        for (let i = 0; i < 7; i++) {
            const d = new Date(primeiroDiaDaSemana);
            d.setDate(primeiroDiaDaSemana.getDate() + i);

            dias.push({
                label: d.toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit"
                }),
                data: formatarDataURL(d),
                isHoje: isMesmaData(d, new Date())
            });
        }

        setDiasSemana(dias);

        const novasEscalas = {};
        const cargosSet = new Set();

        for (const dia of dias) {
            try {
                const data = await api.get(`/escaladodia/${dia.data}`);

                const escalaDia = {};

                data.Escala?.forEach(item => {
                    if (!escalaDia[item.Horario]) escalaDia[item.Horario] = {};
                    if (!escalaDia[item.Horario][item.Cargo]) escalaDia[item.Horario][item.Cargo] = [];
                    escalaDia[item.Horario][item.Cargo].push({ nome: item.Nome, cpf: item.Cpf });
                    cargosSet.add(item.Cargo);
                });

                novasEscalas[dia.data] = escalaDia;
            } catch {
                novasEscalas[dia.data] = {};
            }
        }

        setEscalas(novasEscalas);
        setCargos(
            Array.from(cargosSet).sort((a, b) => {
                const ordem = {
                    "Técnico": 1,
                    "Enfermeiro": 2
                };

                return ordem[a] - ordem[b];
            })
);
    };

    const formatarDataURL = (data) => {
        const d = String(data.getDate()).padStart(2, "0");
        const m = String(data.getMonth() + 1).padStart(2, "0");
        const y = data.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const toISO = (dataBR) => {
        const [d, m, y] = dataBR.split("-");
        return `${y}-${m}-${d}`;
    };

    const normalizarData = (data) =>
        new Date(data).toISOString().split("T")[0];

    const normalizarTurno = (t) =>
        t.replace(/\s+/g, "").toLowerCase();

    const isMesmaData = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const irParaDia = (data) =>
        navigate(`/EscalaDoDia/${data}`);

    const trocaDaCelula = (turno, dataBR) => {
        const dataISO = normalizarData(toISO(dataBR));
        const turnoNorm = normalizarTurno(turno);

        return trocasAprovadas.find(t => {
            const meuDia = normalizarData(t.meudia);
            const diaColega = normalizarData(t.diacolega);

            return (
                normalizarTurno(t.horariosolicitante) === turnoNorm &&
                meuDia === dataISO
            ) || (
                normalizarTurno(t.horariodestinatario) === turnoNorm &&
                diaColega === dataISO
            );
        });
    };

    const proximaSemana = () => {
        const d = new Date(dataReferencia);
        d.setDate(d.getDate() + 7);
        setDataReferencia(d);
    };

    const semanaAnterior = () => {
        const d = new Date(dataReferencia);
        d.setDate(d.getDate() - 7);
        setDataReferencia(d);
    };

    const voltarParaHoje = () =>
        setDataReferencia(new Date());


    const nomeSobrenome = (nomeCompleto) => {           // retorna nome e sobrenome para melhorar visualização na tabela
        const partes = nomeCompleto.trim().split(" ");

        if (partes.length === 1) return partes[0];

        return `${partes[0]} ${partes[1][0].toUpperCase()}`;
    };

    const funcionarioNaTroca = (cpf, troca) => {   // verifica se funcionario participou da troca
    if (!troca) return false;

    return (
        troca.cpfSolicitante === cpf ||
        troca.cpfDestinatario === cpf
    );

};

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Escala da Semana</h2>

            <div className="mb-3 d-flex justify-content-between">
                <button className="btn btn-outline-primary" onClick={semanaAnterior}>
                    ← Semana Anterior
                </button>
                <button className="btn btn-outline-success" onClick={voltarParaHoje}>
                    Semana Atual
                </button>
                <button className="btn btn-outline-primary" onClick={proximaSemana}>
                    Próxima Semana →
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered align-middle text-center">
                    <thead className="table-light">
                        <tr>
                            <th rowSpan={2}>Horário</th>
                            {diasSemana.map((dia, i) => (
                                <th
                                    key={i}
                                    colSpan={cargos.length || 1}
                                    className={dia.isHoje ? "bg-primary text-white" : ""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => irParaDia(dia.data)}
                                >
                                    {dia.label}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {diasSemana.map((_, i) =>
                                (cargos.length ? cargos : ["—"]).map((cargo, j) => (
                                    <th key={`${i}-${j}`}>{cargo}</th>
                                ))
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {horarios.map((horario, r) => (
                            <tr key={r}>
                                <td className="bg-light"><strong>{horario}</strong></td>

                                {diasSemana.map((dia, c) => {
                                    const troca = trocaDaCelula(horario, dia.data);
                                    const escalaDia = escalas[dia.data]?.[horario] || {};

                                    return (cargos.length ? cargos : ["—"]).map((cargo, k) => (
                                        <td
                                            key={`${r}-${c}-${k}`}
                                        >
                                            {escalaDia[cargo]?.length ? (
                                                escalaDia[cargo].map((funcionario, i) => {
                                                    const participanteTroca = funcionarioNaTroca(funcionario.cpf, troca);
                                                    return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            
                                                            color: isUsuarioDesativado(funcionario.nome)
                                                                ? "red"
                                                                : participanteTroca ? "#d39e00" : "inherit",
                                                            fontWeight: participanteTroca ? "bold" : "normal",
                                                            cursor: participanteTroca ? "pointer" : "default"
                                                        }}
                                                        onClick={() => participanteTroca && setModalInfo(troca)}
                                                    >
                                                        • {nomeSobrenome(funcionario.nome)}
                                                    </div>
                                                    );
                                                    })
                                            ) : troca ? (
                                                <div
                                                    style={{
                                                        color: "#d39e00",
                                                        fontWeight: "bold",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => setModalInfo(troca)}
                                                >
                                                    Troca aprovada
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
            
                                        </td>
                                    ));
                                })}
                            </tr>
                        ))}
                    </tbody>

                </table>

                {isCoordenador && (
                <div className="mb-3 d-flex justify-content-center" >
                    <button className="btn btn-outline-success" style={{ textAlign: "center", margin: "0 5px" }} onClick={copiarSemanaAtual}>
                        Copiar Semana
                    </button>
                    {semanaCopiada && (
                        <button className="btn btn-outline-success" style={{ textAlign: "center" }} onClick={colarSemana}>
                            Colar Semana
                        </button>
                    )}
                </div>
                )}

            </div>

            {modalInfo && (
                <div className="modal-bg" onClick={() => setModalInfo(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h4>Troca Aprovada</h4>
                        <p><strong>Solicitante:</strong> {modalInfo.nomeSolicitante}</p>
                        <p><strong>Destinatário:</strong> {modalInfo.nomeDestinatario}</p>
                        <p><strong>Turno solicitante:</strong> {modalInfo.horariosolicitante}</p>
                        <p><strong>Turno destinatário:</strong> {modalInfo.horariodestinatario}</p>
                        <p><strong>Motivo:</strong> {modalInfo.motivo}</p>

                        <button className="btn btn-secondary mt-3" onClick={() => setModalInfo(null)}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EscalaDaSemana;
