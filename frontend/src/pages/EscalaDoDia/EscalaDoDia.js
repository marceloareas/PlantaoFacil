import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./EscalaDoDia.css";

const EscalaDoDia = () => {
    const { data } = useParams(); // espera formato "DD-MM-YYYY"

    const [usuarios, setUsuarios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [escala, setEscala] = useState([]); // estrutura: [row][col] -> array de nomes
    const [nomesAusentes, setNomesAusentes] = useState([]);
    const [escalaExistente, setEscalaExistente] = useState([]);
    const [escalaAnterior, setEscalaAnterior] = useState([]); // lista de objetos {Horario, Nome, Cargo}
    const [user, setUser] = useState(null);

    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const dataRes = await res.json();
                setUsuarios(dataRes);

                const uniqueCategorias = [...new Set(dataRes.map((u) => u.cargo))]
                    .filter((cargo) => cargo.toLowerCase() !== "coordenador");
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
                setEscalaExistente(dataRes.Escala || []);
            } catch (err) {
                console.error("Erro ao buscar escala:", err);
            }
        };

        fetchEscala();
    }, [data]);

    // Monta a escala a partir do objeto escalaExistente
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

    // Busca escala do dia anterior (mesmo formato de resposta)
    useEffect(() => {
        const fetchEscalaAnterior = async () => {
            if (!data) return;

            // data no formato DD-MM-YYYY
            const partes = data.split("-");
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1; // month index
            const ano = parseInt(partes[2], 10);

            const atual = new Date(ano, mes, dia);
            const anterior = new Date(atual);
            anterior.setDate(anterior.getDate() - 1);

            const diaA = String(anterior.getDate()).padStart(2, "0");
            const mesA = String(anterior.getMonth() + 1).padStart(2, "0");
            const anoA = anterior.getFullYear();

            const dataAnterior = `${diaA}-${mesA}-${anoA}`; // mantém formato DD-MM-YYYY

            try {
                const res = await fetch(`http://localhost:8000/escaladodia/${dataAnterior}`);
                if (!res.ok) {
                    setEscalaAnterior([]);
                    return;
                }
                const dataRes = await res.json();
                setEscalaAnterior(dataRes.Escala || []);
            } catch (err) {
                console.error("Erro ao buscar escala anterior:", err);
                setEscalaAnterior([]);
            }
        };

        fetchEscalaAnterior();
    }, [data]);

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

    const nomesPorCategoria = (categoria, horario) =>
        usuarios
            .filter((u) => u.cargo === categoria)
            .filter(
                (u) =>
                    !nomesAusentes.some(
                        (ausente) =>
                            ausente.nome === u.nome_completo &&
                            ausente.ausente === "Sim" &&
                            ausente.horario === horario
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
        const horarioAlvo = horarios[row];

        if (!usuario) {
            alert("Usuário não encontrado!");
            return;
        }

        if (usuario.cargo !== categoriaAlvo) {
            alert(`Erro: ${nome} não pertence à categoria ${categoriaAlvo}`);
            return;
        }

        const estaAusente = nomesAusentes.some(
            (ausente) =>
                ausente.nome === usuario.nome_completo &&
                ausente.ausente === "Sim" &&
                ausente.horario === horarioAlvo
        );


        if (estaAusente) {
            alert(`Erro: ${nome} está ausente neste horário (${horarioAlvo})`);
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

    // Monta um mapa de turnos considerando o dia anterior + dia atual
    const montaMapaTurnos = () => {
        const mapa = {}; // { nome: [ {row, dia: 'anterior'|'atual'} ] }

        // Escala anterior (vinda da API)
        escalaAnterior.forEach(item => {
            const row = horarios.indexOf(item.Horario);
            if (row >= 0) {
                if (!mapa[item.Nome]) mapa[item.Nome] = [];
                mapa[item.Nome].push({ row, dia: 'anterior' });
            }
        });

        // Escala atual (estado 'escala' com estrutura matricial)
        escala.forEach((linha, rowIdx) => {
            linha.forEach((coluna) => {
                coluna.forEach((nome) => {
                    if (!mapa[nome]) mapa[nome] = [];
                    mapa[nome].push({ row: rowIdx, dia: 'atual' });
                });
            });
        });

        return mapa;
    };

    const validaTurnosSeguidos = () => {
        const mapa = montaMapaTurnos();

        for (const [nome, dados] of Object.entries(mapa)) {
            const ordenados = dados.slice().sort((a, b) => {
                if (a.dia === b.dia) return a.row - b.row;
                return a.dia === 'anterior' ? -1 : 1;
            });

            let consecutivos = 1;

            for (let i = 1; i < ordenados.length; i++) {
                const atual = ordenados[i];
                const anterior = ordenados[i - 1];

                if (atual.dia === anterior.dia && atual.row === anterior.row + 1) {
                    consecutivos++;
                }
                else if (
                    anterior.dia === 'anterior' &&
                    atual.dia === 'atual' &&
                    anterior.row === horarios.length - 1 &&
                    atual.row === 0
                ) {
                    consecutivos++;
                } else {
                    consecutivos = 1; 
                }

                if (consecutivos >= 3) {
                    alert(`Erro: ${nome} está escalado em ${consecutivos} turnos consecutivos!\nTotalizando mais de 24 horas seguidas de trabalho.`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            DataEscala: data,
            Escala: []
        };

        if (!validaTurnosSeguidos()) {
            return;
        }

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
                                            const nomes = Array.from(
                                                new Map(
                                                    horarios.flatMap(h => nomesPorCategoria(cat, h))
                                                        .map(u => [u.nome, u])
                                                ).values()
                                            ); return (
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
                        <h3>Colaboradores Indisponíveis</h3>
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
            {user && user.cargo !== "Coordenador" && (
                <h2>Você não tem permissão para acessar esta página.</h2>
            )}
        </div>
    );
};

export default EscalaDoDia;
