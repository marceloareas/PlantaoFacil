import { useNavigate } from "react-router-dom";
    import { useEffect, useState, React } from "react";
    import "./TrocaModel.css";
    import "bootstrap/dist/css/bootstrap.min.css";
    import { api } from "./api/Api";

const TrocaModal = ({ show, onClose, troca}) =>{

        const toISO = (dataBR) => {
            const [d, m, y] = dataBR.split("-");
            return `${y}-${m}-${d}`;
        };
    
    
        const [dataReferencia, setDataReferencia] = useState(
            troca?.meudia
            ? new Date(toISO(troca.meudia))
            : new Date()
            );
        const [diasSemana, setDiasSemana] = useState([]);
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
    
        useEffect(() => {
            gerarDiasDaSemana(dataReferencia);
        }, [dataReferencia]);
    
        const gerarDiasDaSemana = async (referencia) => {
            const dias = [];
    
            for (let i = -3; i <= 3; i++) {
                const d = new Date(referencia);
                d.setDate(referencia.getDate() + i);
    
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
    
        const normalizarData = (data) =>
            new Date(data).toISOString().split("T")[0];
    
        const normalizarTurno = (t) =>
            t.replace(/\s+/g, "").toLowerCase();
    
        const isMesmaData = (a, b) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    
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

        if (!show) return null;
    
            return (
                <div className ="modal-overlay">
                    <div className="modal-content">
                        <div className="container mt-4">
                            <h2 className="mb-4" style={{textAlign:"center"}}>Escala Prevista pos troca</h2>
                
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

                            <div className="modal-buttons">
                                <button className="btn-aprovar" onClick={onClose}>
                                Aprovar
                                </button>
                                <button className="btn-rejeitar" onClick={onClose}>
                                Recusar
                                </button>
                            </div>
                            
                        </div>
                    </div>
                </div>
        );
    };
    
    export default TrocaModal;