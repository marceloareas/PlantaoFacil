import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./TrocaModel.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { api } from "./api/Api";

const TrocaModal = ({ show, onClose, troca, atualizarsituacao }) => {
    const toISO = (dataStr) => {
        if (!dataStr) return new Date();
        if (dataStr instanceof Date) return dataStr;

        // Se já estiver no formato YYYY-MM-DD
        if (dataStr.includes("-") && dataStr.startsWith("20")) {
            const [y, m, d] = dataStr.split("-").map(Number);
            return new Date(y, m - 1, d);
        }

        // Se estiver no formato DD-MM-YYYY ou DD/MM/YYYY
        const separador = dataStr.includes("/") ? "/" : "-";
        const [d, m, y] = dataStr.split(separador).map(Number);
        return new Date(y, m - 1, d);
    };

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

    // 1. BUSCA escala da semana
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

        const dadosBrutosDoDia = {};
        const cargosSet = new Set();

        for (const dia of dias) {
            try {
                const data = await api.get(`/escaladodia/${dia.data}`);
                const escalaDia = {};

                if (data && data.Escala) {
                    data.Escala.forEach(item => {
                        if (!escalaDia[item.Horario]) escalaDia[item.Horario] = {};
                        if (!escalaDia[item.Horario][item.Cargo]) escalaDia[item.Horario][item.Cargo] = [];
                        escalaDia[item.Horario][item.Cargo].push({ nome: item.Nome, cpf: item.Cpf });
                        cargosSet.add(item.Cargo);
                    });
                }
                dadosBrutosDoDia[dia.data] = escalaDia;
            } catch (err) {
                console.error(`Erro ao buscar escala do dia ${dia.data}:`, err);
                dadosBrutosDoDia[dia.data] = {};
            }
        }

        setCargos(prev => {
            const novoSet = new Set([...prev, ...cargosSet]);
            return Array.from(novoSet).sort((a, b) => {
                const ordem = { "Técnico": 1, "Enfermeiro": 2 };
                return (ordem[a] || 99) - (ordem[b] || 99);
            });
        });

        return dadosBrutosDoDia;
    };

    // 2. CENTRALIZADOR DE SEMANAS E TROCAS (EVITA ATROPELAMENTO DE ESTADO)
    useEffect(() => {
        if (!show || !troca) return;

        const carregarSemanas = async () => {
            const data1 = new Date(toISO(troca.meudia));
            const data2 = new Date(toISO(troca.diacolega));

            setDiasSemana1([]);
            setDiasSemana2([]);
            setCargos([]);

            // Busca as tabelas e aguarda
            const dadosTabela1 = await gerarDiasDaSemana(data1, setDiasSemana1);
            let dadosTabela2 = {};

            if (!mesmaSemana()) {
                dadosTabela2 = await gerarDiasDaSemana(data2, setDiasSemana2);
            }

            // juntar tabelas antes de simular troca
            const novasEscalas = { ...dadosTabela1, ...dadosTabela2 };

            const dataMeuDiaBR = formatarDataURL(new Date(toISO(troca.meudia)));
            const dataColegaBR = formatarDataURL(new Date(toISO(troca.diacolega)));

            const turnoSolicitante = troca.horariosolicitante;
            const turnoDestinatario = troca.horariodestinatario;

            let funcSolicitanteObj = null;
            let funcDestinatarioObj = null;

            if (!novasEscalas[dataMeuDiaBR]) novasEscalas[dataMeuDiaBR] = {};
            if (!novasEscalas[dataColegaBR]) novasEscalas[dataColegaBR] = {};

            // Encontra solicitante na tabela
            if (novasEscalas[dataMeuDiaBR][turnoSolicitante]) {
                Object.keys(novasEscalas[dataMeuDiaBR][turnoSolicitante]).forEach(cargo => {
                    const encontrado = novasEscalas[dataMeuDiaBR][turnoSolicitante][cargo].find(f => f.cpf === troca.cpfSolicitante);
                    if (encontrado) funcSolicitanteObj = { ...encontrado, cargo };
                });
            }

            // Encontra destinatário na tabela
            if (novasEscalas[dataColegaBR][turnoDestinatario]) {
                Object.keys(novasEscalas[dataColegaBR][turnoDestinatario]).forEach(cargo => {
                    const encontrado = novasEscalas[dataColegaBR][turnoDestinatario][cargo].find(f => f.cpf === troca.cpfDestinatario);
                    if (encontrado) funcDestinatarioObj = { ...encontrado, cargo };
                });
            }

            if (!funcSolicitanteObj) funcSolicitanteObj = { nome: troca.nomeSolicitante || "Solicitante", cpf: troca.cpfSolicitante, cargo: "Técnico" };
            if (!funcDestinatarioObj) funcDestinatarioObj = { nome: troca.nomeDestinatario || "Destinatário", cpf: troca.cpfDestinatario, cargo: "Técnico" };

            // Remove os turnos antes da troca
            if (novasEscalas[dataMeuDiaBR][turnoSolicitante]?.[funcSolicitanteObj.cargo]) {
                novasEscalas[dataMeuDiaBR][turnoSolicitante][funcSolicitanteObj.cargo] = novasEscalas[dataMeuDiaBR][turnoSolicitante][funcSolicitanteObj.cargo].filter(f => f.cpf !== troca.cpfSolicitante);
            }
            if (novasEscalas[dataColegaBR][turnoDestinatario]?.[funcDestinatarioObj.cargo]) {
                novasEscalas[dataColegaBR][turnoDestinatario][funcDestinatarioObj.cargo] = novasEscalas[dataColegaBR][turnoDestinatario][funcDestinatarioObj.cargo].filter(f => f.cpf !== troca.cpfDestinatario);
            }

            // adiciona troca feita
            if (!novasEscalas[dataColegaBR][turnoDestinatario]) novasEscalas[dataColegaBR][turnoDestinatario] = {};
            if (!novasEscalas[dataColegaBR][turnoDestinatario][funcSolicitanteObj.cargo]) novasEscalas[dataColegaBR][turnoDestinatario][funcSolicitanteObj.cargo] = [];
            novasEscalas[dataColegaBR][turnoDestinatario][funcSolicitanteObj.cargo].push({ nome: funcSolicitanteObj.nome, cpf: funcSolicitanteObj.cpf });

            if (!novasEscalas[dataMeuDiaBR][turnoSolicitante]) novasEscalas[dataMeuDiaBR][turnoSolicitante] = {};
            if (!novasEscalas[dataMeuDiaBR][turnoSolicitante][funcDestinatarioObj.cargo]) novasEscalas[dataMeuDiaBR][turnoSolicitante][funcDestinatarioObj.cargo] = [];
            novasEscalas[dataMeuDiaBR][turnoSolicitante][funcDestinatarioObj.cargo].push({ nome: funcDestinatarioObj.nome, cpf: funcDestinatarioObj.cpf });

            setCargos(prev => {
                const novoSet = new Set([...prev, funcSolicitanteObj.cargo, funcDestinatarioObj.cargo]);
                return Array.from(novoSet).sort((a, b) => {
                    const ordem = { "Técnico": 1, "Enfermeiro": 2 };
                    return (ordem[a] || 99) - (ordem[b] || 99);
                });
            });

            // Seta o estado final uma única vez
            setEscalas(novasEscalas);
        };

        carregarSemanas();
    }, [troca, show]);

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

    const normalizarTurno = (t) => t.replace(/\s+/g, "").toLowerCase();

    const isMesmaData = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const trocaDaCelula = (turno, dataBR) => {
        const dataISO = normalizarData(toISO(dataBR));
        const turnoNorm = normalizarTurno(turno);

        const todasTrocas = [...trocasAprovadas];
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

    const funcionarioNaTroca = (cpf, troca) => {
        if (!troca) return false;
        return (troca.cpfSolicitante === cpf || troca.cpfDestinatario === cpf);
    };

    const nomeSobrenome = (nomeCompleto) => {
        const partes = nomeCompleto.trim().split(" ");
        if (partes.length === 1) return partes[0];
        return `${partes[0]} ${partes[1][0].toUpperCase()}`;
    };

    const getInicioSemana = (data) => {
        const d = new Date(data);
        const dia = d.getDay();
        d.setDate(d.getDate() - dia);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const mesmaSemana = () => {
        if (!troca) return false;
        const inicio1 = formatarDataURL(getInicioSemana(new Date(toISO(troca.meudia))));
        const inicio2 = formatarDataURL(getInicioSemana(new Date(toISO(troca.diacolega))));
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
                                    <td key={`${r}-${c}-${k}`}>
                                        {escalaDia[cargo]?.length ? (
                                            escalaDia[cargo].map((funcionario, i) => {
                                                const participanteTroca = funcionarioNaTroca(funcionario.cpf, trocaEncontrada);
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            color: participanteTroca
                                                                ? trocaEncontrada?.id === troca?.id
                                                                    ? "#198754"
                                                                    : "#d39e00"
                                                                : "inherit",
                                                            fontWeight: participanteTroca ? "bold" : "normal",
                                                        }}
                                                    >
                                                        • {nomeSobrenome(funcionario.nome)}
                                                    </div>
                                                );
                                            })
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

    if (!show || !troca) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="container mt-4">
                    <button className="btn-close-modal" onClick={onClose} style={{float: "right", border: "none", background: "none", fontSize: "1.5rem"}}>×</button>
                    <h2 className="mb-4" style={{ textAlign: "center" }}>Escala após troca</h2>

                    {renderTabela(diasSemana1)}
                    {!mesmaSemana() && renderTabela(diasSemana2)}

                    <div className="modal-buttons text-center mt-3">
                        {troca.situacao === "Pendente" && (
                            <div>
                                <button className="btn-aprovar mx-2" onClick={() => { atualizarsituacao(troca.id, "Aprovada"); onClose(); }}>
                                    Aprovar
                                </button>
                                <button className="btn-rejeitar mx-2" onClick={() => { atualizarsituacao(troca.id, "Rejeitada"); onClose(); }}>
                                    Recusar
                                </button>
                            </div>
                        )}
                        {troca.situacao === "Desfeita" && (
                            <button className="btn-aprovar" onClick={() => { atualizarsituacao(troca.id, "Aprovada"); onClose(); }}>
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