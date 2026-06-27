import { useEffect, useState } from "react";
import "./trocas.css";
import { api } from "../../components/api/Api";
import TrocaModal from "../../components/TrocaModal";

const TrocasAprovacao = () => {
    const [user, setUser] = useState(null);
    const [trocas, setTrocas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [trocaSelecionada, setTrocaSelecionada] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const fetchTrocas = async () => {
            try {
                const data = await api.get("/trocas/");
                setTrocas(data);
            } catch (err) {
                console.error("Erro ao buscar trocas:", err);
            }
        };
        fetchTrocas();
    }, []);

    const atualizarsituacao = async (id, novosituacao) => {
        try {
            const path =
                novosituacao === "Aprovada"
                    ? `/trocas/${id}/aprovar`
                    : `/trocas/${id}/rejeitar`;

            await api.put(path);

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

    const desfazerTroca = async (t) => {
        try {
            await api.put(`/trocas/${t.id}/desfazer`);

            alert("Troca desfeita com sucesso!");

            setTrocas((prev) =>
                prev.map((x) =>
                    x.id === t.id ? { ...x, situacao: "Desfeita" } : x
                )
            );
        } catch (err) {
            console.error(err);
            alert("Erro ao desfazer troca.");
        }
    };

    const refazerTroca = async (t) => {
        try {
            await api.put(`/trocas/${t.id}/aprovar`);

            alert("Troca refeita com sucesso!");

            setTrocas((prev) =>
                prev.map((x) =>
                    x.id === t.id ? { ...x, situacao: "Aprovada" } : x
                )
            );
        } catch (err) {
            console.error(err);
            alert("Erro ao refazer troca.");
        }
    };

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
                            <th>Situação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trocas.map((t) => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.nomeSolicitante}</td>
                                <td>{t.meudia} - {t.horariosolicitante}</td>
                                <td>{t.nomeDestinatario}</td>
                                <td>{t.diacolega} - {t.horariodestinatario}</td>
                                <td>{t.motivo || "—"}</td>
                                <td>
                                    <span className={`situacao-${t.situacao?.toLowerCase()}`}>
                                        {t.situacao}
                                    </span>
                                </td>

                                <td>
                                    {t.situacao === "Pendente" && (
                                        <>
                                            <button
                                                className="btm-ver"
                                                onClick={()=> {
                                                    setTrocaSelecionada(t);     // passar a troca como parametro
                                                    setShowModal(true)}}
                                                >
                                                    ver
                                                </button>
                                        </>
                                    )}

                                    {t.situacao === "Aprovada" && (
                                        <button
                                            className="btn-rejeitar"
                                            onClick={() => desfazerTroca(t)}
                                        >
                                            Desfazer
                                        </button>
                                    )}

                                    {t.situacao === "Desfeita" && (
                                        <button
                                            className="btn-ver"
                                            onClick={() => {setTrocaSelecionada(t);     // passar a troca como parametro
                                                                setShowModal(true)}}
                                        >
                                            ver
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <TrocaModal
                show={showModal}
                onClose={() => setShowModal(false)}
                troca={trocaSelecionada}
                atualizarsituacao={atualizarsituacao}
            />
        </div>
    );
};

export default TrocasAprovacao;
