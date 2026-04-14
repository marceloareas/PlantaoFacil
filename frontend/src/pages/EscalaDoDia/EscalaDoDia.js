import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./EscalaDoDia.css";

const EscalaDoDia = () => {
    const { data } = useParams();
    const navigate = useNavigate();

    const [categorias, setCategorias] = useState([]);
    const [escala, setEscala] = useState([]);
    const [escalaExistente, setEscalaExistente] = useState([]);
    const [user, setUser] = useState(null);

    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    //  Pegar usuário logado
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    // Pegar categorias
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const dataRes = await res.json();

                const uniqueCategorias = [...new Set(dataRes.map((u) => u.cargo))]
                    .filter((cargo) => cargo && cargo.toLowerCase() !== "coordenador");

                setCategorias(uniqueCategorias);
            } catch (err) {
                console.error("Erro ao buscar usuários:", err);
            }
        };

        fetchUsuarios();
    }, []);

    // Criar estrutura vazia da escala
    useEffect(() => {
        if (categorias.length > 0) {
            const novaEscala = Array.from({ length: horarios.length }, () =>
                Array.from({ length: categorias.length }, () => [])
            );
            setEscala(novaEscala);
        }
    }, [categorias]);

    // Buscar escala do backend
    useEffect(() => {
        if (!data) return;

        const fetchEscala = async () => {
            try {
                const res = await fetch(`http://localhost:8000/escaladodia/${data}`);
                if (!res.ok) return;

                const dataRes = await res.json();
                setEscalaExistente(dataRes.Escala || []);
            } catch (err) {
                console.error("Erro ao buscar escala:", err);
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
                novaEscala[row][col].push(item.Nome);
            }
        });

        setEscala(novaEscala);
    }, [escalaExistente, categorias]);

    return (
        <div className="escala-page">
            <h2>
                Escala do Dia: {data ? data.replaceAll("-", "/") : "Nenhuma data"}
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
                                    {escala[rowIdx]?.[colIdx]?.length > 0
                                        ? escala[rowIdx][colIdx].join(", ")
                                        : "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            
              {user?.cargo?.toLowerCase() === "coordenador" && (
                <button
                    className="botao-editar"
                    onClick={() => navigate(`/EditarEscala/${data}`)}
                >
                    Editar Escala
                </button>
            )}
            

        </div>
    );
};

export default EscalaDoDia;