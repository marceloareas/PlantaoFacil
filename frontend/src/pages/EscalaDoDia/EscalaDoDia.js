import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./EscalaDoDia.css";

const EscalaDoDia = () => {
    const { data } = useParams();

    const [usuarios, setUsuarios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [escala, setEscala] = useState([]);
    const [nomesAusentes, setNomesAusentes] = useState([]);
    const [escalaExistente, setEscalaExistente] = useState([]);
    const [user, setUser] = useState(null);

    const horarios = ["08:00 - 12:00", "13:00 - 17:00"];

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const dataRes = await res.json();
                setUsuarios(dataRes);

                const uniqueCategorias = [...new Set(dataRes.map((u) => u.cargo))];
                setCategorias(uniqueCategorias);
            } catch (err) {
                console.error("Erro ao buscar usuários:", err);
            }
        };

        fetchUsuarios();
    }, []);

    useEffect(() => {
        if (categorias.length > 0) {
            const novaEscala = Array.from({ length: horarios.length }, () =>
                Array.from({ length: categorias.length }, () => [])
            );
            setEscala(novaEscala);
        }
    }, [categorias]);

    useEffect(() => {
        const fetchEscala = async () => {
            if (!data) return;
            try {
                const res = await fetch(`http://localhost:8000/escaladodia/${data}`);
                if (!res.ok) return;
                const dataRes = await res.json();
                setEscalaExistente(dataRes.Escala);
            } catch (err) {
                console.error("Erro ao buscar escala:", err);
            }
        };

        fetchEscala();
    }, [data]);

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

    useEffect(() => {
        const fetchAusentes = async () => {
            if (!data) return;
            try {
                const dataFormatted = data.substring(6, 10) + "-" + data.substring(3, 5) + "-" + data.substring(0, 2);
                console.log("Data formatada para busca de ausentes:", dataFormatted);
                const res = await fetch(`http://localhost:8000/ausentes/${dataFormatted}`);
                if (!res.ok) {
                    setNomesAusentes([]);
                    return;
                }
                const dataRes = await res.json();
                setNomesAusentes(dataRes);
            } catch (err) {
                console.error("Erro ao buscar ausentes:", err);
            }
        };

        fetchAusentes();
    }, [data]);

    const nomesPorCategoria = (categoria) =>
        usuarios
            .filter((u) => u.cargo === categoria) 
            .filter(
                (u) =>
                    !nomesAusentes.some(
                        (ausente) =>
                            ausente.nome === u.nome_completo && ausente.ausente === "Sim"
                    )
            ) 
            .map((u) => ({ nome: u.nome_completo, cargo: u.cargo }));

    const handleDragStart = (e, nome) => {
        e.dataTransfer.setData("nome", nome);
    };

    const allowDrop = (e) => e.preventDefault();

    const handleDrop = (e, row, col) => {
        e.preventDefault();
        const nome = e.dataTransfer.getData("nome");

        const categoriaAlvo = categorias[col];
        const usuario = usuarios.find((u) => u.nome_completo === nome);

        if (!usuario) {
            alert("Usuário não encontrado!");
            return;
        }

        if (usuario.cargo !== categoriaAlvo) {
            alert(`Erro: ${nome} não pertence à categoria ${categoriaAlvo}`);
            return;
        }

        const novaEscala = [...escala];
        if (!novaEscala[row][col].includes(nome)) {
            novaEscala[row][col].push(nome);
        }
        setEscala(novaEscala);
    };

    const removerNome = (row, col, nome) => {
        const novaEscala = [...escala];
        novaEscala[row][col] = novaEscala[row][col].filter((n) => n !== nome);
        setEscala(novaEscala);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            DataEscala: data,
            Escala: []
        };

        horarios.forEach((horario, rowIdx) => {
            categorias.forEach((categoria, colIdx) => {
                escala[rowIdx][colIdx].forEach((nome) => {
                    payload.Escala.push({
                        Horario: horario,
                        Nome: nome,
                        Cargo: categoria
                    });
                });
            });
        });

        try {
            const method = escalaExistente.length > 0 ? "PUT" : "POST";
            const res = await fetch(`http://localhost:8000/escaladodia/${data}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Erro ao enviar escala");

            const dataRes = await res.json();
            console.log("Escala enviada:", dataRes);
            alert("Escala enviada com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar escala");
        }
    };

    const maxRows = Math.max(
        ...categorias.map((cat) => nomesPorCategoria(cat).length),
        2
    );

    return (
        <div className="escala-page">
            <h2>
                Escala do Dia: {data ? data.replaceAll("-", "/") : "Nenhuma data selecionada"}
            </h2>
            {user && user.cargo === "Coordenador" && (
                <div className="escala-layout">
                    <div className="nomes-box">
                        <h3>Nomes disponíveis</h3>
                        <table className="nomes-table">
                            <thead>
                                <tr>
                                    {categorias.map((cat, idx) => (
                                        <th key={idx}>{cat}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: maxRows }).map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {categorias.map((cat, colIdx) => {
                                            const nomes = nomesPorCategoria(cat);
                                            return (
                                                <td key={colIdx}>
                                                    {nomes[rowIdx] && (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) =>
                                                                handleDragStart(e, nomes[rowIdx].nome)
                                                            }
                                                            className="nome-item"
                                                        >
                                                            {nomes[rowIdx].nome}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="escala-box">
                        <h3>Escala</h3>
                        <form onSubmit={handleSubmit} className="form">
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
                                                <td
                                                    key={colIdx}
                                                    onDragOver={allowDrop}
                                                    onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                                                    className="escala-cell"
                                                >
                                                    {escala[rowIdx] &&
                                                        escala[rowIdx][colIdx] &&
                                                        escala[rowIdx][colIdx].length > 0 ? (
                                                        escala[rowIdx][colIdx].map((nome, i) => (
                                                            <div key={i} className="nome-escala">
                                                                {nome}{" "}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removerNome(rowIdx, colIdx, nome)
                                                                    }
                                                                    className="remove-btn"
                                                                >
                                                                    x
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="submit" className="submit-button">
                                Enviar Escala
                            </button>
                        </form>
                    </div>
                    <div className="ausentes-box">
                        <h3>Colaboradores Ausentes</h3>
                        <table className="colab-ausente">
                            <thead>
                                <tr>
                                    <th>Nome - Horário</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nomesAusentes
                                    .filter(item => item.ausente === "Sim") 
                                    .map((colab) => (
                                        <tr key={colab.id}>
                                            <td>{`${colab.nome} - ${colab.horario}`}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )} 
            {!user && user.cargo !== "Coordenador" && (
            <h2>Você não tem permissão para acessar esta página.</h2>
            )}
        </div>
    );
};

export default EscalaDoDia;
