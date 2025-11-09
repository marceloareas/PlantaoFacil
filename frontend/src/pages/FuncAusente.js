import { useState, useEffect } from "react";
import AddAusenteModal from "../components/AddAusenteModal";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FuncAusente.css";

const FuncionariosAusentes = () => {
    const [ausentes, setAusentes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [dataFiltro, setDataFiltro] = useState("");

    const fetchAusentes = async (dataSelecionada = "") => {
        try {
            const url = dataSelecionada
                ? `http://localhost:8000/ausentes/${dataSelecionada}`
                : "http://localhost:8000/ausentes/";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Erro ao buscar ausentes");
            const data = await res.json();
            setAusentes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setAusentes([]);
        }
    };

    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
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
            const res = await fetch(`http://localhost:8000/ausentes/${cpf}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Erro ao excluir ausente");
            await fetchAusentes(dataFiltro);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="ausentes-page container mt-4">
            {/* Título no topo */}
            <h2 className="mb-4">Funcionários Ausentes</h2>

            {/* Filtros e botão */}
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
                    {user && user.cargo === "Coordenador" && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Adicionar Ausência
                    </button>)}
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
                            <th>Data</th>
                            <th>Horário</th>
                            {user && user.cargo === "Coordenador" && (
                            <th>Ações</th>
                            )}
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
                                {user && user.cargo === "Coordenador" && (
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

            <AddAusenteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => fetchAusentes(dataFiltro)}
            />
        </div>
    );
};

export default FuncionariosAusentes;
