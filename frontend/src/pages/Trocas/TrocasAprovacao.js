import { useEffect, useState } from "react";
import "./trocas.css";
import { api } from "../../components/api/Api";
import TrocaModal from "../../components/TrocaModal";
import { isGestor } from "../../components/utils/perfis";

// aceita "AAAA-MM-DD" e "DD-MM-AAAA"; devolve ISO para comparar com as datas do período
const paraIso = (data) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return data;
    const partes = /^(\d{2})-(\d{2})-(\d{4})$/.exec(data || "");
    return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : null;
};

const estiloAvisoLimite = {
    marginTop: "6px",
    padding: "4px 8px",
    backgroundColor: "#fff3cd",
    border: "1px solid #f0ad4e",
    borderRadius: "4px",
    color: "#856404",
    fontSize: "0.85em",
    fontWeight: "bold",
};

const TrocasAprovacao = () => {
    const [user, setUser] = useState(null);
    const [trocas, setTrocas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [trocaSelecionada, setTrocaSelecionada] = useState(null);
    const [avisosAbertos, setAvisosAbertos] = useState([]);

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

    useEffect(() => {
        if (!isGestor(user)) return;
        // os avisos são só informativos: se a chamada falhar a tela segue sem eles
        api.get("/avisos/abertos")
            .then((data) => setAvisosAbertos(data?.avisos || []))
            .catch((err) => console.error("Erro ao buscar avisos de limite:", err));
    }, [user]);

    // cada aviso vale para o seu período: a troca recebe o alerta do período em que ela cai
    const avisoDeTrocas = (troca) => {
        const dia = paraIso(troca.meudia);
        if (!dia) return null;

        return avisosAbertos.find(
            (a) =>
                a.tipo === "trocas" &&
                a.cpf === troca.cpfSolicitante &&
                dia >= a.periodo.data_inicio &&
                dia <= a.periodo.data_fim
        ) || null;
    };

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

    if (!isGestor(user))
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
                        {trocas.map((t) => {
                            const aviso = avisoDeTrocas(t);
                            return (
                                <tr key={t.id}>
                                    <td>{t.id}</td>
                                    <td>
                                        {t.nomeSolicitante}
                                        {aviso && (
                                            <div style={estiloAvisoLimite} title={aviso.mensagem}>
                                                Acima do limite de trocas do período ({aviso.quantidade}/{aviso.limite})
                                            </div>
                                        )}
                                    </td>
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
                            );
                        })}
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
