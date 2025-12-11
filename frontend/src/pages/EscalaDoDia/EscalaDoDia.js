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
    const [escalaAnterior, setEscalaAnterior] = useState([]);
    const [user, setUser] = useState(null);

    const [trocasAprovadas, setTrocasAprovadas] = useState([]);
    const [modalInfo, setModalInfo] = useState(null);

    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const toISO = (dataBR) => {
        if (!dataBR) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataBR)) return dataBR; 
        const [d, m, y] = dataBR.split("-");
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        if (!data) return;

        const fetchTrocas = async () => {
            try {
                const res = await fetch("http://localhost:8000/trocas/");
                const dataRes = await res.json();

                const [dia, mes, ano] = data.split("-");
                const dataISO = `${ano}-${mes}-${dia}`;

                const aprovadas = dataRes.filter((t) => {
                    if (t.situacao !== "Aprovada") return false;
                    const meuDiaBR = (t.meudia);
                    const diaColegaBR = (t.diacolega);
                    console.log("Comparando trocas:", meuDiaBR, diaColegaBR, "com", dataISO);
                    return meuDiaBR === dataISO || diaColegaBR === dataISO;
                });
                console.log("Trocas aprovadas para a data:", aprovadas);
                setTrocasAprovadas(aprovadas);
            } catch (err) {
                console.error("Erro ao buscar trocas aprovadas:", err);
            }
        };

        fetchTrocas();
    }, [data]);

    const envolvidosEmTroca = trocasAprovadas.flatMap((t) => [
        { nome: t.solicitante, turno: t.horariodestinatario },
        { nome: t.destinatario, turno: t.horariosolicitante },
    ]);

    const estaEmTroca = (nome, turnoAtual) => {
        console.log("Checando troca para:", nome, turnoAtual, envolvidosEmTroca);
        if(envolvidosEmTroca.some((e) => e.nome === nome && e.turno === turnoAtual)){
            console.log("Encontrado em troca:", nome, turnoAtual);
        }
        return envolvidosEmTroca.some((e) => e.nome === nome && e.turno === turnoAtual);
    };

    const getTrocaInfo = (nome, turnoAtual) => {
        return trocasAprovadas.find(
            (t) =>
                (t.solicitante === nome && t.horariodestinatario === turnoAtual) ||
                (t.destinatario === nome && t.horariosolicitante === turnoAtual)
        );
    };

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const dataRes = await res.json();
                const ativos = dataRes.filter(
                    (u) => u.situacao === "Ativo" && u.cargo.toLowerCase() !== "coordenador"
                );
                setUsuarios(ativos);

                const uniqueCategorias = [...new Set(dataRes.map((u) => u.cargo))].filter(
                    (cargo) => cargo && cargo.toLowerCase() !== "coordenador"
                );
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

    useEffect(() => {
        if (escalaExistente.length === 0 || categorias.length === 0) return;

        const novaEscala = Array.from({ length: horarios.length }, () =>
            Array.from({ length: categorias.length }, () => [])
        );

        escalaExistente.forEach((item) => {
            const row = horarios.indexOf(item.Horario);
            const col = categorias.indexOf(item.Cargo);
            if (row >= 0 && col >= 0) novaEscala[row][col].push(item.Nome);
        });

        setEscala(novaEscala);
    }, [escalaExistente, categorias]);

    useEffect(() => {
        if (!data) return;

        const partes = data.split("-");
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const ano = parseInt(partes[2], 10);

        const atual = new Date(ano, mes, dia);
        const anterior = new Date(atual);
        anterior.setDate(anterior.getDate() - 1);

        const diaA = String(anterior.getDate()).padStart(2, "0");
        const mesA = String(anterior.getMonth() + 1).padStart(2, "0");
        const anoA = anterior.getFullYear();

        const dataAnterior = `${diaA}-${mesA}-${anoA}`;

        const fetchEscalaAnterior = async () => {
            try {
                const res = await fetch(`http://localhost:8000/escaladodia/${dataAnterior}`);
                if (!res.ok) {
                    setEscalaAnterior([]);
                    return;
                }
                const dataRes = await res.json();
                setEscalaAnterior(dataRes.Escala || []);
            } catch (err) {
                setEscalaAnterior([]);
            }
        };

        fetchEscalaAnterior();
    }, [data]);

    useEffect(() => {
        if (!data) return;

        const fetchAusentes = async () => {
            try {
                const dataISO = toISO(data); 
                const res = await fetch(`http://localhost:8000/ausentes/${dataISO}`);
                if (!res.ok) {
                    setNomesAusentes([]);
                    return;
                }
                const dataRes = await res.json();
                setNomesAusentes(dataRes || []);
            } catch (err) {
                console.error("Erro ao buscar ausentes:", err);
                setNomesAusentes([]);
            }
        };

        fetchAusentes();
    }, [data]);

    const isTurnoBlockedByAusencia = (dataBR, turno, ausencia) => {
        if (!ausencia || !ausencia.data) return false;

        const inicioISO = ausencia.data;
        const fimISO = ausencia.data_final || ausencia.data; 

        const diaISO = toISO(dataBR);

        if (diaISO > inicioISO && diaISO < fimISO) {
            return true;
        }

        if (diaISO === inicioISO) {
            return turno === (ausencia.horario || "");
        }

        if (diaISO === fimISO) {
            const turnoFinal = ausencia.horario_final || ausencia.horario || "";
            return turno === turnoFinal;
        }

        return false;
    };

    const isUserAbsentForTurn = (nome, turno) => {
        if (!nomesAusentes || nomesAusentes.length === 0) return false;

        return nomesAusentes.some((a) => {
            if (a.ausente !== "Sim") return false;
            if (a.nome !== nome && a.nome !== `${nome}`) return false; 
            return isTurnoBlockedByAusencia(data, turno, a);
        });
    };

    const nomesPorCategoria = (categoria, horario) =>
        usuarios
            .filter((u) => u.cargo === categoria)
            .filter((u) => !isUserAbsentForTurn(u.nome_completo, horario))
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

        if (isUserAbsentForTurn(usuario.nome_completo, horarioAlvo)) {
            alert(`Erro: ${nome} está ausente neste horário (${horarioAlvo})`);
            return;
        }

        const novaEscala = escala.map((linha) => linha.map((col) => [...col]));
        if (!novaEscala[row][col].includes(nome)) novaEscala[row][col].push(nome);
        setEscala(novaEscala);
    };

    const removerNome = (row, col, nome) => {
        const novaEscala = escala.map((linha) => linha.map((col) => [...col]));
        novaEscala[row][col] = novaEscala[row][col].filter((n) => n !== nome);
        setEscala(novaEscala);
    };

    const montaMapaTurnos = () => {
        const mapa = {};

        escalaAnterior.forEach((item) => {
            const row = horarios.indexOf(item.Horario);
            if (row >= 0) {
                if (!mapa[item.Nome]) mapa[item.Nome] = [];
                mapa[item.Nome].push({ row, dia: "anterior" });
            }
        });

        escala.forEach((linha, rowIdx) => {
            linha.forEach((coluna) => {
                coluna.forEach((nome) => {
                    if (!mapa[nome]) mapa[nome] = [];
                    mapa[nome].push({ row: rowIdx, dia: "atual" });
                });
            });
        });

        return mapa;
    };

    const validaTurnosSeguidos = () => {
        const mapa = montaMapaTurnos();

        for (const [nome, dados] of Object.entries(mapa)) {
            const ordenados = dados
                .slice()
                .sort((a, b) => {
                    if (a.dia === b.dia) return a.row - b.row;
                    return a.dia === "anterior" ? -1 : 1;
                });

            let consecutivos = 1;

            for (let i = 1; i < ordenados.length; i++) {
                const atual = ordenados[i];
                const anterior = ordenados[i - 1];

                if (atual.dia === anterior.dia && atual.row === anterior.row + 1) {
                    consecutivos++;
                } else if (
                    anterior.dia === "anterior" &&
                    atual.dia === "atual" &&
                    anterior.row === horarios.length - 1 &&
                    atual.row === 0
                ) {
                    consecutivos++;
                } else {
                    consecutivos = 1;
                }

                if (consecutivos >= 3) {
                    alert(`Erro: ${nome} está escalado em ${consecutivos} turnos consecutivos!`);
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
            Escala: [],
        };

        if (!validaTurnosSeguidos()) return;

        horarios.forEach((horario, rowIdx) => {
            categorias.forEach((categoria, colIdx) => {
                escala[rowIdx][colIdx].forEach((nome) => {
                    payload.Escala.push({ Horario: horario, Nome: nome, Cargo: categoria });
                });
            });
        });

        try {
            const method = escalaExistente.length > 0 ? "PUT" : "POST";
            const res = await fetch(`http://localhost:8000/escaladodia/${data}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Erro ao enviar escala");
            alert("Escala enviada com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar escala");
        }
    };

    const maxRows = Math.max(...categorias.map((cat) => nomesPorCategoria(cat, horarios[0]).length), 2);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [dia, mes, ano] = data ? data.split("-").map(Number) : [null, null, null];
    const dataSelecionada = data ? new Date(ano, mes - 1, dia) : null;
    if (dataSelecionada) dataSelecionada.setHours(0, 0, 0, 0);
    const isDataPassada = dataSelecionada && dataSelecionada < hoje;

    return (
        <div className="escala-page">
            {isDataPassada && (<h2 className="alert alert-danger"> Observando data passada </h2>)}
            <h2>
                Escala do Dia: {data ? data.replaceAll("-", "/") : "Nenhuma data selecionada"}
            </h2>

            {user && user.cargo === "Coordenador" && (
                <div className="escala-layout">
                    <div className="nomes-box">
                        <h3>Nomes disponíveis</h3>
                        <table className="nomes-table">
                            <thead>
                                <tr>{categorias.map((cat, idx) => <th key={idx}>{cat}</th>)}</tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: maxRows }).map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {categorias.map((cat, colIdx) => {
                                            const nomes = Array.from(
                                                new Map(
                                                    horarios
                                                        .flatMap((h) => nomesPorCategoria(cat, h))
                                                        .map((u) => [u.nome, u])
                                                ).values()
                                            );

                                            return (
                                                <td key={colIdx}>
                                                    {nomes[rowIdx] && (
                                                        <div
                                                            draggable={!isDataPassada}
                                                            onDragStart={(e) => handleDragStart(e, nomes[rowIdx].nome)}
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
                        <form onSubmit={!isDataPassada ? handleSubmit : (e) => e.preventDefault()} className="form">
                            <table className="escala-table">
                                <thead>
                                    <tr>
                                        <th>Horário</th>
                                        {categorias.map((cat, idx) => <th key={idx}>{cat}</th>)}
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
                                                    {escala[rowIdx] && escala[rowIdx][colIdx] && escala[rowIdx][colIdx].length > 0 ? (
                                                        escala[rowIdx][colIdx].map((nome, i) => {
                                                            const turnoAtual = horarios[rowIdx];
                                                            const trocado = estaEmTroca(nome, turnoAtual);
                                                            const info = getTrocaInfo(nome, turnoAtual);

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="nome-escala"
                                                                    style={{
                                                                        color: trocado ? "orange" : "inherit",
                                                                        fontWeight: trocado ? "bold" : "normal",
                                                                        cursor: trocado ? "pointer" : "default",
                                                                    }}
                                                                    onClick={() => {
                                                                        if (trocado && info) setModalInfo(info);
                                                                    }}
                                                                >
                                                                    {nome}{" "}
                                                                    {!trocado && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removerNome(rowIdx, colIdx, nome)}
                                                                            className="remove-btn"
                                                                        >
                                                                            X
                                                                        </button>
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

                            {!isDataPassada && user && user.cargo === "Coordenador" && (
                                <button type="submit" className="submit-button">Enviar Escala</button>
                            )}
                        </form>
                    </div>

                    <div className="ausentes-box">
                        <h3>Colaboradores Indisponíveis</h3>
                        <table className="colab-ausente">
                            <thead>
                                <tr>
                                    <th>Nome - Turnos bloqueados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nomesAusentes
                                    .filter((item) => item.ausente === "Sim")
                                    .map((colab) => {
                                        const bloqueios = horarios.filter((h) => isTurnoBlockedByAusencia(data, h, colab));
                                        return (
                                            <tr key={colab.id}>
                                                <td>{`${colab.nome} - ${bloqueios.length > 0 ? bloqueios.join(", ") : colab.horario}`}</td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {user && user.cargo !== "Coordenador" && <h2>Você não tem permissão para acessar esta página.</h2>}

            {modalInfo && (
                <div className="modal-bg" onClick={() => setModalInfo(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2>Troca Aprovada</h2>
                        <p>
                            <strong>Solicitante:</strong> {modalInfo.solicitante}
                        </p>
                        <p>
                            <strong>Destinatário:</strong> {modalInfo.destinatario}
                        </p>
                        <p>
                            <strong>Turno do Solicitante:</strong> {modalInfo.horariosolicitante}
                        </p>
                        <p>
                            <strong>Turno do Destinatário:</strong> {modalInfo.horariodestinatario}
                        </p>
                        <p>
                            <strong>Motivo:</strong> {modalInfo.motivo}
                        </p>

                        <button className="close-modal" onClick={() => setModalInfo(null)}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EscalaDoDia;
