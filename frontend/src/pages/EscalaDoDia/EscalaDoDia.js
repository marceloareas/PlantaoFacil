import { useParams } from "react-router-dom";
import { useState } from "react";
import "./EscalaDoDia.css";

const EscalaDoDia = () => {
    const { data } = useParams();

    const [nomesDisponiveis, setNomesDisponiveis] = useState([
        { nome: "Andressa", categoria: "Categoria 1", horario: "08-12h" },
        { nome: "Antonio", categoria: "Categoria 1", horario: "13-17h" },
        { nome: "Luiz", categoria: "Categoria 2", horario: "08-12h" },
        { nome: "Nickolas", categoria: "Categoria 2", horario: "13-17h" },
    ]);

    const [nomesAusentes, setNomesAusentes] = useState([
        { nome: "Marcelo", categoria: "Categoria 1", horario: "08-12h" }
    ]);

    const [escala, setEscala] = useState([
        ["", ""],
        ["", ""],
    ]);

    const handleDragStart = (e, nome) => {
        e.dataTransfer.setData("nome", nome);
    };

    const allowDrop = (e) => e.preventDefault();

    const handleDrop = (e, row, col) => {
        e.preventDefault();
        const nome = e.dataTransfer.getData("nome");

        const novaEscala = [...escala];
        novaEscala[row][col] = nome;
        setEscala(novaEscala);
    };

    const ordenarPorHorario = (a, b) => {
        const horarios = { "08-12h": 1, "13-17h": 2 };
        return horarios[a.horario] - horarios[b.horario];
    };

    const nomesPorCategoria = (categoria) =>
        nomesDisponiveis
            .filter((n) => n.categoria === categoria)
            .sort(ordenarPorHorario);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Escala submetida:", escala);
        alert("Escala enviada com sucesso!");
    };

    return (
        <div className="escala-page">
            <h2>
                Escala do Dia:{" "}
                {data ? data.replaceAll("-", "/") : "Nenhuma data selecionada"}
            </h2>

            <div className="escala-layout">
                <div className="nomes-box">
                    <h3>Nomes disponíveis</h3>
                    <table className="nomes-table">
                        <thead>
                            <tr>
                                <th>Categoria 1</th>
                                <th>Categoria 2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 2 }).map((_, idx) => {
                                const nomes1 = nomesPorCategoria("Categoria 1");
                                const nomes2 = nomesPorCategoria("Categoria 2");
                                return (
                                    <tr key={idx}>
                                        <td>
                                            {nomes1[idx] ? (
                                                <div
                                                    draggable
                                                    onDragStart={(e) =>
                                                        handleDragStart(e, nomes1[idx].nome)
                                                    }
                                                    className="nome-item"
                                                >
                                                    {`${nomes1[idx].nome} - ${nomes1[idx].horario}`}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td>
                                            {nomes2[idx] ? (
                                                <div
                                                    draggable
                                                    onDragStart={(e) =>
                                                        handleDragStart(e, nomes2[idx].nome)
                                                    }
                                                    className="nome-item"
                                                >
                                                    {`${nomes2[idx].nome} - ${nomes2[idx].horario}`}
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
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
                                    <th>Categoria 1</th>
                                    <th>Categoria 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {["08:00 - 12:00", "13:00 - 17:00"].map(
                                    (horario, rowIdx) => (
                                        <tr key={rowIdx}>
                                            <td>{horario}</td>
                                            {[0, 1].map((colIdx) => (
                                                <td
                                                    key={colIdx}
                                                    onDragOver={allowDrop}
                                                    onDrop={(e) =>
                                                        handleDrop(e, rowIdx, colIdx)
                                                    }
                                                    className="escala-cell"
                                                >
                                                    {escala[rowIdx][colIdx] || "—"}
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                )}
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
                                <th>Nome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nomesAusentes.map((colab, idx) => (
                                <tr key={idx}>
                                    <td>{colab.nome}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EscalaDoDia;
