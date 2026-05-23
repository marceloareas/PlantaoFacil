import { useNavigate } from "react-router-dom";
    import { useEffect, useState, React } from "react";
    import "./TrocaModel.css";
    import "bootstrap/dist/css/bootstrap.min.css";
    import { api } from "./api/Api";

const TrocaModal = ({ show, onClose, troca, atualizarsituacao}) =>{

        const toISO = (dataStr) => {
            if (!dataStr) return new Date();
            if (dataStr instanceof Date) return dataStr;

            // Se já estiver no formato YYYY-MM-DD
            if (dataStr.includes("-") && dataStr.startsWith("20")) {
                const [y, m, d] = dataStr.split("-").map(Number);
                return new Date(y, m - 1, d); // Mês no JS começa em 0
            }

            // Se estiver no formato DD-MM-YYYY ou DD/MM/YYYY
            const separador = dataStr.includes("/") ? "/" : "-";
            const [d, m, y] = dataStr.split(separador).map(Number);
            return new Date(y, m - 1, d);
        };
    
    
        const [dataReferencia, setDataReferencia] = useState(
            troca?.meudia
            ? new Date(toISO(troca.meudia))
            : new Date()
            );
        const [diasSemana1, setDiasSemana1] = useState([]);
        const [diasSemana2, setDiasSemana2] = useState([]);
        const [escalas, setEscalas] = useState({});
        const [cargos, setCargos] = useState([]);
        const [usuarios, setUsuarios] = useState([]);
        const [trocasAprovadas, setTrocasAprovadas] = useState([]);

    
    
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
    
        const gerarDiasDaSemana = async (referencia, setDiasSemana) => {
            const inicioSemana = getInicioSemana(referencia);
            const dias = [];

            for (let i = 0; i < 7; i++) {

                const d = new Date(inicioSemana);
                d.setDate(inicioSemana.getDate() + i);

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
    
            setEscalas(prev => ({ ...prev, ...novasEscalas }));
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
    
        const normalizarData = (data) => {
            const d = new Date(data);
            if (isNaN(d.getTime())) {
                console.error("Data inválida:", data);
                return null;
            }

            return d.toISOString().split("T")[0];
        };
    
        const normalizarTurno = (t) =>
            t.replace(/\s+/g, "").toLowerCase();
    
        const isMesmaData = (a, b) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    
        const trocaDaCelula = (turno, dataBR) => {

            const dataISO = normalizarData(toISO(dataBR));
            const turnoNorm = normalizarTurno(turno);

            // cria lista temporária
            const todasTrocas = [...trocasAprovadas];

            // adiciona a troca atual no preview
            if (troca) {
                todasTrocas.push(troca);
            }

            return todasTrocas.find(t => {

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
    
        const funcionarioNaTroca = (cpf, troca) => {   // verifica se funcionario participou da troca
        if (!troca) return false;
    
        return (
            troca.cpfSolicitante === cpf ||
            troca.cpfDestinatario === cpf
        );
    
    };

    const nomeSobrenome = (nomeCompleto) => {
            const partes = nomeCompleto.trim().split(" ");

            if (partes.length === 1) return partes[0];

            return `${partes[0]} ${partes[1][0].toUpperCase()}`;
        };

        const getInicioSemana = (data) => {
            const d = new Date(data);

            const dia = d.getDay(); // 0 domingo
            const diff = dia === 0 ? -6 : 1 - dia;

            d.setDate(d.getDate() + diff);
            d.setHours(0,0,0,0);

            return d;
        };

       const mesmaSemana = () => {

            if (!troca) return false;

            const inicio1 = formatarDataURL(
                getInicioSemana(new Date(toISO(troca.meudia)))
            );

            const inicio2 = formatarDataURL(
                getInicioSemana(new Date(toISO(troca.diacolega)))
            );

            return inicio1 === inicio2;
        };

        

        const renderTabela = (diasSemana) => (
            <div className="table-responsive mb-5">
                <table className="table table-bordered align-middle text-center">
                    <thead className="table-light">
                        <tr>
                            <th rowSpan={2}>Horário</th>
                            {diasSemana.map((dia, i) => (
                                <th
                                    key={i}
                                    colSpan={cargos.length || 1}
                                    className={dia.isHoje ? "bg-primary text-white" : ""}
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
                                    const trocaEncontrada = trocaDaCelula(horario, dia.data);
                                    const escalaDia = escalas[dia.data]?.[horario] || {};

                                    return (cargos.length ? cargos : ["—"]).map((cargo, k) => (
                                        <td
                                            key={`${r}-${c}-${k}`}
                                        >
                                            {escalaDia[cargo]?.length ? (
                                                escalaDia[cargo].map((funcionario, i) => {
                                                    const participanteTroca = funcionarioNaTroca(funcionario.cpf, trocaEncontrada);
                                                    return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                        color: participanteTroca
                                                            ? trocaEncontrada?.id === troca?.id
                                                                ? "#198754" // verde = troca atual
                                                                : "#d39e00" // laranja = antigas
                                                            : "inherit",

                                                        fontWeight: participanteTroca
                                                            ? "bold"
                                                            : "normal",
                                                    }}
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
                                                >
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
            </div>
        );

        useEffect(() => {
            if (!show) return;

            const carregarSemanas = async () => {

            const data1 = new Date(toISO(troca.meudia));
            const data2 = new Date(toISO(troca.diacolega));

            // limpa estados antigos
            setDiasSemana1([]);
            setDiasSemana2([]);
            setEscalas({});

            await gerarDiasDaSemana(data1, setDiasSemana1);

            if (!mesmaSemana()) {
                await gerarDiasDaSemana(data2, setDiasSemana2);
            }
        };

    carregarSemanas();
        }, [troca]);

        if (!show || !troca) return null;
    
        return (
            <div className ="modal-overlay">
                <div className="modal-content">
                    <div className="container mt-4">
                        <h2 className="mb-4" style={{textAlign:"center"}}>Escala após troca</h2>

                        {renderTabela(diasSemana1)}     
                        {!mesmaSemana() && renderTabela(diasSemana2)}


                        <div className="modal-buttons">

                            {troca.situacao === "Pendente" && (
                                <div>
                                    <button className="btn-aprovar" onClick={() => {atualizarsituacao(troca.id, "Aprovada"); onClose();}}>
                                        Aprovar
                                    </button>
                                    <button className="btn-rejeitar" onClick={() => {atualizarsituacao(troca.id, "Rejeitada"); onClose();}}>
                                        Recusar
                                    </button>
                                </div>
                            )}
                            {troca.situacao === "Desfeita" && (
                                    <button
                                        className="btn-aprovar"
                                        onClick={() => {atualizarsituacao(troca.id, "Aprovada"); onClose();}}
                                    >
                                        Refazer
                                    </button>
                                )}
                        </div>
                        
                    </div>
                </div>
            </div>
    );
};

export default TrocaModal;