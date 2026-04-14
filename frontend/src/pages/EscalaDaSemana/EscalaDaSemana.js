import { useNavigate } from "react-router-dom";
import { useEffect, useState, React } from "react";
import "./EscalaDaSemana.css";
import "bootstrap/dist/css/bootstrap.min.css";

const EscalaDaSemana = () => {
    const navigate = useNavigate();

    const [dataReferencia, setDataReferencia] = useState(new Date());
    const [diasSemana, setDiasSemana] = useState([]);
    const [escalas, setEscalas] = useState({});
    const [cargos, setCargos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [trocasAprovadas, setTrocasAprovadas] = useState([]);
    const [modalInfo, setModalInfo] = useState(null);

    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    useEffect(() => {
        fetch("http://localhost:8000/usuario/")
            .then(res => res.json())
            .then(setUsuarios)
            .catch(err => console.error("Erro usuários:", err));
    }, []);

    const isUsuarioDesativado = (nome) =>
        usuarios.some(
            u => u.nome_completo === nome && u.situacao === "Desativado"
        );

    useEffect(() => {
        fetch("http://localhost:8000/trocas/")
            .then(res => res.json())
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
                const res = await fetch(`http://localhost:8000/escaladodia/${dia.data}`);
                const data = await res.json();

                const escalaDia = {};

                data.Escala?.forEach(item => {
                    if (!escalaDia[item.Horario]) escalaDia[item.Horario] = {};
                    if (!escalaDia[item.Horario][item.Cargo]) escalaDia[item.Horario][item.Cargo] = [];
                    escalaDia[item.Horario][item.Cargo].push(item.Nome);
                    cargosSet.add(item.Cargo);
                });

                novasEscalas[dia.data] = escalaDia;
            } catch {
                novasEscalas[dia.data] = {};
            }
        }

        setEscalas(novasEscalas);
        setCargos(Array.from(cargosSet).sort());
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
                                                escalaDia[cargo].map((nome, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            color: isUsuarioDesativado(nome)
                                                                ? "red"
                                                                : troca ? "#d39e00" : "inherit",
                                                            fontWeight: troca ? "bold" : "normal",
                                                            cursor: troca ? "pointer" : "default"
                                                        }}
                                                        onClick={() => troca && setModalInfo(troca)}
                                                    >
                                                        • {nome}
                                                    </div>
                                                ))
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
            </div>

            {modalInfo && (
                <div className="modal-bg" onClick={() => setModalInfo(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h4>Troca Aprovada</h4>
                        <p><strong>Solicitante:</strong> {modalInfo.solicitante}</p>
                        <p><strong>Destinatário:</strong> {modalInfo.destinatario}</p>
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
