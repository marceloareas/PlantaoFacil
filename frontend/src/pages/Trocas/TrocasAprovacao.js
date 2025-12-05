import { useEffect, useState } from "react";
import "./trocas.css";

const TrocasAprovacao = () => {
    const [user, setUser] = useState(null);
    const [trocas, setTrocas] = useState([]);

    useEffect(() => {
        const userData = localStorage.getItem("user");
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

    const atualizarsituacao = async (id, novosituacao) => {
        try {
            const endpoint =
                novosituacao === "Aprovada"
                    ? `http://localhost:8000/trocas/${id}/aprovar`
                    : `http://localhost:8000/trocas/${id}/rejeitar`;

            const res = await fetch(endpoint, { method: "PUT" });
            if (!res.ok) throw new Error("Erro ao atualizar troca");

            setTrocas((prev) =>
                prev.map((t) =>
                    t.id === id ? { ...t, situacao: novosituacao } : t
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
                            <th>Solicitante</th>
                            <th>Seu Dia/Horário</th>
                            <th>Destinatário</th>
                            <th>Dia/Horário do colega</th>
                            <th>Motivo</th>
                            <th>situacao</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trocas.map((t) => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.solicitante}</td>
                                <td>{t.meudia} - {t.horariosolicitante}</td>
                                <td>{t.destinatario}</td>
                                <td>{t.diacolega} - {t.horariodestinatario}</td>
                                <td>{t.motivo || "—"}</td>
                                <td>
                                    <span className={`situacao-${t.situacao.toLowerCase()}`}>
                                        {t.situacao}
                                    </span>
                                </td>
                                <td>
                                    {t.situacao === "Pendente" && (
                                        <>
                                            <button
                                                className="btn-aprovar"
                                                onClick={() => atualizarsituacao(t.id, "Aprovada")}
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                className="btn-rejeitar"
                                                onClick={() => atualizarsituacao(t.id, "Rejeitada")}
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
