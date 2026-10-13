import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./EscalaDoDia.css";
import { api, getSetorAtual } from "../../components/api/Api";
import { isGestor } from "../../components/utils/perfis";
import FaltaModal from "../../components/FaltaModal";

const categorias = ["Enfermeiro", "Tecnico"];
const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

const toISO = (dataBR) => {
    const [d, m, y] = dataBR.split("-");
    return `${y}-${m}-${d}`;
};

const EscalaDoDia = () => {
    const { data } = useParams();
    const navigate = useNavigate();
    const setorAtual = getSetorAtual();
    const [escala, setEscala] = useState([]);
    const [escalaExistente, setEscalaExistente] = useState([]);
    const [user, setUser] = useState(null);

    const [faltas, setFaltas] = useState([]);
    const [versaoFaltas, setVersaoFaltas] = useState(0);
    const [faltaSelecionada, setFaltaSelecionada] = useState(null);

    //  Pegar usuário logado
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const gestor = isGestor(user);

    // Criar estrutura vazia da escala
    useEffect(() => {
        if (categorias.length > 0) {
            const novaEscala = Array.from({ length: horarios.length }, () =>
                Array.from({ length: categorias.length }, () => [])
            );
            setEscala(novaEscala);
        }
    }, []);

    // Buscar escala do backend
    useEffect(() => {
        if (!data) return;

        const fetchEscala = async () => {
            try {
                const dataRes = await api.get(`/escaladodia/${data}`);
                setEscalaExistente(dataRes.Escala || []);
            } catch (err) {
                if (err.status !== 404) {
                    console.error("Erro ao buscar escala:", err);
                }
            }
        };

        fetchEscala();
    }, [data]);

    // Preencher escala
    useEffect(() => {
        if (escalaExistente.length === 0 || categorias.length === 0) return;

        const novaEscala = Array.from({ length: horarios.length }, () =>
            Array.from({ length: categorias.length }, () => [])
        );

        escalaExistente.forEach((item) => {
            const row = horarios.indexOf(item.Horario);
            const col = categorias.indexOf(item.Cargo);

            if (row >= 0 && col >= 0) {
                novaEscala[row][col].push({ nome: item.Nome, cpf: item.Cpf, tipo: item.Tipo });
            }
        });

        setEscala(novaEscala);
    }, [escalaExistente]);

    useEffect(() => {
        if (!gestor || !data) return;

        let ativo = true;
        const dataISO = toISO(data);

        api.get(`/faltas/?inicio=${dataISO}&fim=${dataISO}`)
            .then((res) => { if (ativo) setFaltas(res || []); })
            .catch((err) => console.error("Erro ao buscar faltas:", err));

        return () => { ativo = false; };
    }, [gestor, data, versaoFaltas]);

    const faltaDe = (cpf, horario) => {
        const dataISO = toISO(data);
        return faltas.find(
            (f) => f.cpf === cpf && f.data === dataISO && f.horario === horario
        ) || null;
    };

    return (
        <div className="escala-page">
            <h2>
                Escala do Dia: {data ? data.replaceAll("-", "/") : "Nenhuma data"}
                {setorAtual && ` — ${setorAtual.nome}`}
            </h2>

            <table className="escala-table">
                <thead>
                    <tr>
                        <th>Horário</th>
                        {categorias.map((cat, idx) => (
                            <th key={idx}>{cat}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {horarios.map((horario, rowIdx) => (
                        <tr key={rowIdx}>
                            <td>{horario}</td>

                            {categorias.map((_, colIdx) => (
                                <td key={colIdx}>
                                    {escala[rowIdx]?.[colIdx]?.length > 0 ? (
                                        escala[rowIdx][colIdx].map((funcionario, i) => {
                                            const falta = gestor ? faltaDe(funcionario.cpf, horario) : null;
                                            return (
                                                <div
                                                    key={i}
                                                    className="nome-funcionario"
                                                    style={gestor ? { cursor: "pointer" } : undefined}
                                                    title={gestor ? "Registrar ou ver falta" : undefined}
                                                    onClick={gestor ? () => setFaltaSelecionada({
                                                        funcionario: { nome: funcionario.nome, cpf: funcionario.cpf },
                                                        horario
                                                    }) : undefined}
                                                >
                                                    <span style={{ textDecoration: falta ? "line-through" : "none" }}>
                                                        {funcionario.nome}
                                                    </span>
                                                    {funcionario.tipo === "extra" && (
                                                        <span className="badge bg-info text-dark ms-1">extra</span>
                                                    )}
                                                    {falta && (
                                                        <span className="badge bg-danger ms-1">faltou</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        "—"
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            
              {gestor && (
                <button
                    className="botao-editar"
                    onClick={() => navigate(`/EditarEscala/${data}`)}
                >
                    Editar Escala
                </button>
            )}

            <FaltaModal
                show={!!faltaSelecionada}
                onClose={() => setFaltaSelecionada(null)}
                funcionario={faltaSelecionada?.funcionario}
                dataBR={data}
                horario={faltaSelecionada?.horario}
                falta={
                    faltaSelecionada
                        ? faltaDe(faltaSelecionada.funcionario.cpf, faltaSelecionada.horario)
                        : null
                }
                onAlterado={() => {
                    setFaltaSelecionada(null);
                    setVersaoFaltas((v) => v + 1);
                }}
            />


        </div>
    );
};

export default EscalaDoDia;