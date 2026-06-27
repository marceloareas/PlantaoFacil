import { useState, useEffect } from "react";
import AddAusenteModal from "../../components/AddAusenteModal";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FuncAusente.css";
import { api } from '../../components/api/Api';
import ConflitoModal from "../../components/ConflitoModal";
import MotivoModal from "../../components/MotivoModal";

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

    const handleDelete = async (cpf) => {
        if (!window.confirm("Deseja realmente remover este ausente?")) return;

        try {
            await api.delete(`/ausentes/${cpf}`);
            await fetchAusentes(dataFiltro);
        } catch (err) {
            console.error(err);
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
                    if (e.Nome === func.nome && e.Horario === func.horario) {
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
                    const existe = data.Escala?.some(
                        (e) => e.Nome === func.nome && e.Horario === turno
                    );

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
            <h2 className="mb-4">Funcionários Indisponíveis</h2>

            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2 align-items-center">
                    <input
                        type="date"
                        className="form-control"
                        style={{ maxWidth: "200px" }}
                        value={dataFiltro}
                        onChange={(e) => setDataFiltro(e.target.value)}
                    />

                    <button
                        className="btn btn-secondary"
                        onClick={() => setDataFiltro("")}
                    >
                        Limpar
                    </button>

                    {user?.cargo === "Coordenador" && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            + Adicionar Ausência
                        </button>
                    )}
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
                            {user?.cargo === "Coordenador" && <th>Ações</th>}
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

                                {user?.cargo === "Coordenador" && (
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(func.cpf)}
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
