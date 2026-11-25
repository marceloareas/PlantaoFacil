import { useState, useEffect } from "react";
import AddAusenteModal from "../../components/AddAusenteModal";
import { isGestor } from "../../components/utils/perfis";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FuncAusente.css";
import { api } from '../../components/api/Api';
import ConflitoModal from "../../components/ConflitoModal";
import MotivoModal from "../../components/MotivoModal";
import { avisar, confirmar } from "../../components/Mensagens";
import CampoData from "../../components/CampoData";
import { FaSearch } from "react-icons/fa";

const FuncionariosAusentes = () => {
    const [ausentes, setAusentes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [dataFiltro, setDataFiltro] = useState("");

    const [conflitos, setConflitos] = useState([]);
    const [showConflitosModal, setShowConflitosModal] = useState(false);
    const [funcSelecionado, setFuncSelecionado] = useState(null);
    const [loadingConflitos, setLoadingConflitos] = useState(false);

    const [showMotivoModal, setShowMotivoModal] = useState(false);
    const [motivoSelecionado, setMotivoSelecionado] = useState("");

    const [user, setUser] = useState(null);

    const fetchAusentes = async (dataSelecionada = "") => {
        try {
            const path = dataSelecionada
                ? `/ausentes/${dataSelecionada}`
                : "/ausentes/";

            const data = await api.get(path);
            setAusentes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setAusentes([]);
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        fetchAusentes();
    }, []);

    useEffect(() => {
        fetchAusentes(dataFiltro);
    }, [dataFiltro]);

    const handleDelete = async (func) => {
        const confirmado = await confirmar(
            func.remover_da_escala
                ? `Deseja realmente remover a indisponibilidade de ${func.nome}?\n\nOs plantões retirados da escala por ela serão devolvidos.`
                : `Deseja realmente remover a indisponibilidade de ${func.nome}?`,
            { variante: "atencao", textoOk: "Remover" }
        );
        if (!confirmado) return;

        try {
            const resposta = await api.delete(`/ausentes/${func.id}`);
            await fetchAusentes(dataFiltro);

            const restaurados = resposta?.restaurados || [];
            const naoRestaurados = resposta?.nao_restaurados || [];
            const formatar = (p) => `${p.data.replace(/-/g, "/")} - ${p.horario}`;
            if (restaurados.length > 0 || naoRestaurados.length > 0) {
                const partes = [];
                if (restaurados.length > 0) {
                    partes.push(`Plantões devolvidos à escala:\n${restaurados.map(formatar).join("\n")}`);
                }
                if (naoRestaurados.length > 0) {
                    partes.push(
                        `Não devolvidos:\n${naoRestaurados.map((p) => `${formatar(p)} (${p.motivo})`).join("\n")}`
                    );
                }
                avisar(partes.join("\n\n"), {
                    titulo: "Indisponibilidade removida",
                    variante: naoRestaurados.length > 0 ? "atencao" : "sucesso",
                });
            }
        } catch (err) {
            console.error(err);
            avisar(err.message || "Não foi possível remover a indisponibilidade.", { variante: "erro" });
        }
    };

    const verificarConflitosEscala = async (func) => {
        const conflitos = [];
        const TURNOS = ["07:00 - 19:00", "19:00 - 07:00"];

        const formatarDataURL = (iso) => {
            const [y, m, d] = iso.split("-");
            return `${d}-${m}-${y}`;
        };

        const formatarDataBR = (iso) => {
            const [y, m, d] = iso.split("-");
            return `${d}-${m}-${y}`;
        };

        if (!func.data_final) {
            try {
                const data = await api.get(
                    `/escaladodia/${formatarDataURL(func.data)}`
                );
                data.Escala?.forEach((e) => {
                    const mesmoFuncionario = (e.Cpf || e.cpf || e.CPF) === (func.cpf || "");
                    if (mesmoFuncionario && e.Horario === func.horario) {
                        conflitos.push({
                            data: formatarDataBR(func.data),
                            horario: e.Horario,
                        });
                    }
                });
            } catch {
                
            }
            return conflitos;
        }

        let atual = new Date(func.data);
        const fim = new Date(func.data_final);

        while (atual <= fim) {
            const dataISO = atual.toISOString().split("T")[0];
            const dataURL = formatarDataURL(dataISO);

            let turnosParaVerificar = [];

            if (dataURL === func.data) {
                turnosParaVerificar = [func.horario];
            } else if (dataURL === func.data_final) {
                turnosParaVerificar = [func.horario_final];
            } else {
                turnosParaVerificar = TURNOS;
            }

            try {
                const data = await api.get(`/escaladodia/${dataURL}`);

                for (const turno of turnosParaVerificar) {
                    const existe = data.Escala?.some((e) => {
                        const mesmoFuncionario = (e.Cpf || e.cpf || e.CPF) === (func.cpf || "");
                        return mesmoFuncionario && e.Horario === turno;
                    });

                    console.log(
                        "Verificando conflito:",
                        dataISO,
                        turno,
                        existe
                    );

                    if (existe) {
                        conflitos.push({
                            data: formatarDataBR(dataISO),
                            horario: turno,
                        });
                    }
                }
            } catch {
                // sem escala nesse dia
            }

            atual.setDate(atual.getDate() + 1);
        }

        return conflitos;
    };

    return (
        <div className="ausentes-page container mt-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h2 className="mb-0">Funcionários Indisponíveis</h2>

                {isGestor(user) && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Adicionar Indisponibilidade
                    </button>
                )}
            </div>

            <div className="consulta-box mb-3">
                <label className="form-label fw-semibold mb-2">
                    <FaSearch className="me-2" />
                    Consultar indisponíveis em uma data
                </label>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <CampoData
                        style={{ maxWidth: "220px" }}
                        value={dataFiltro}
                        onChange={(e) => setDataFiltro(e.target.value)}
                    />

                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setDataFiltro("")}
                        disabled={!dataFiltro}
                    >
                        Limpar consulta
                    </button>
                </div>
            </div>

            {ausentes.length === 0 ? (
                <p className="text-muted">Nenhum funcionário ausente encontrado.</p>
            ) : (
                <table className="table table-bordered table-striped">
                    <thead className="table-light">
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Cargo</th>
                            <th>Data Inicial</th>
                            <th>Horário Inicial</th>
                            <th>Data Final</th>
                            <th>Horário Final</th>
                            <th>Motivo</th>
                            <th>Conflitos</th>
                            {isGestor(user) && <th>Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {ausentes.map((func, idx) => (
                            <tr key={idx}>
                                <td>{func.nome}</td>
                                <td>{func.cpf}</td>
                                <td>{func.cargo || "—"}</td>
                                <td>{func.data}</td>
                                <td>{func.horario || "—"}</td>
                                <td>{func.data_final || "—"}</td>
                                <td>{func.horario_final || "—"}</td>
                                <td>  
                                    
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={async () => {
                                            setMotivoSelecionado(func.motivo);
                                            setFuncSelecionado(func);
                                            setShowMotivoModal(true);
                                        }}
                                    >
                                        { "Ver Motivo"}
                                    </button>   

                                    </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={async () => {
                                            setLoadingConflitos(true);
                                            setFuncSelecionado(func);
                                            const res = await verificarConflitosEscala(func);
                                            setConflitos(res);
                                            setLoadingConflitos(false);
                                            setShowConflitosModal(true);
                                        }}
                                    >
                                        {loadingConflitos ? "..." : "Ver Conflitos"}
                                    </button>
                                </td>

                                {isGestor(user) && (
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(func)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <MotivoModal
                show={showMotivoModal}
                onClose={() => setShowMotivoModal(false)}
                motivo={motivoSelecionado}
                descricao={funcSelecionado?.descricao}
                nome={funcSelecionado?.nome}
            />

            <ConflitoModal
                show={showConflitosModal}
                onClose={() => setShowConflitosModal(false)}
                conflitos={conflitos}
                funcSelecionado={funcSelecionado}
            />

            <AddAusenteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => fetchAusentes(dataFiltro)}
            />
        </div>
    );
};

export default FuncionariosAusentes;
