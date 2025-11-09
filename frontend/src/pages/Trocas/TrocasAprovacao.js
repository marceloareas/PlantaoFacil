import { useEffect, useState } from "react";
import "./trocas.css";

const TrocasAprovacao = () => {
    const [user, setUser] = useState(null);
    const [trocas, setTrocas] = useState([]);

    useEffect(() => {
        const userData = sessionStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const fetchTrocas = async () => {
            try {
                const res = await fetch("http://localhost:8000/trocas/");
                const data = await res.json();
                setTrocas(data);
            } catch (err) {
                console.error("Erro ao buscar trocas:", err);
            }
        };
        fetchTrocas();
    }, []);

    const atualizarStatus = async (id, novoStatus) => {
        try {
            const endpoint =
                novoStatus === "Aprovada"
                    ? `http://localhost:8000/trocas/${id}/aprovar`
                    : `http://localhost:8000/trocas/${id}/rejeitar`;

            const res = await fetch(endpoint, { method: "PUT" });
            if (!res.ok) throw new Error("Erro ao atualizar troca");

            // Atualiza localmente
            setTrocas((prev) =>
                prev.map((t) =>
                    t.id === id ? { ...t, status: novoStatus } : t
                )
            );
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar troca.");
        }
    };

    if (!user) return <p>Carregando usuário...</p>;

    if (user.cargo !== "Coordenador")
        return <h2>Você não tem permissão para acessar esta página.</h2>;

    return (
        <div className="trocas-aprovacao-container">
            <h2>Gerenciamento de Trocas</h2>

            {trocas.length === 0 ? (
                <p>Nenhuma solicitação de troca encontrada.</p>
            ) : (
                <table className="tabela-trocas">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Horário</th>
                            <th>Solicitante</th>
                            <th>Destinatário</th>
                            <th>Motivo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trocas.map((t) => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{new Date(t.data).toLocaleDateString()}</td>
                                <td>{t.horario}</td>
                                <td>{t.solicitante}</td>
                                <td>{t.destinatario}</td>
                                <td>{t.motivo || "—"}</td>
                                <td>
                                    <span
                                        className={`status-${t.status.toLowerCase()}`}
                                    >
                                        {t.status}
                                    </span>
                                </td>
                                <td>
                                    {t.status === "Pendente" && (
                                        <>
                                            <button
                                                className="btn-aprovar"
                                                onClick={() =>
                                                    atualizarStatus(t.id, "Aprovada")
                                                }
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                className="btn-rejeitar"
                                                onClick={() =>
                                                    atualizarStatus(t.id, "Rejeitada")
                                                }
                                            >
                                                Rejeitar
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TrocasAprovacao;
