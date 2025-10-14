import { useNavigate } from "react-router-dom";
import { useEffect, useState, React } from "react";
import "./EscalaDaSemana.css";
import 'bootstrap/dist/css/bootstrap.min.css';

const EscalaDaSemana = () => {
    const navigate = useNavigate();
    const [diasSemana, setDiasSemana] = useState([]);
    const [escalas, setEscalas] = useState({});

    useEffect(() => {
        gerarDiasDaSemana();
    }, []);

    const gerarDiasDaSemana = () => {
        const hoje = new Date();
        const dias = [];
        const novasEscalas = {};

        for (let i = -3; i <= 3; i++) {
            const novaData = new Date(hoje);
            novaData.setDate(hoje.getDate() + i);
            const dataFormatada = formatarDataURL(novaData);

            dias.push({
                label: formatarLabel(novaData),
                data: dataFormatada,
                isHoje: i === 0
            });

            novasEscalas["2025-10-13"] = {
                "08:00 - 12:00": {
                    "Categoria 1": ["Andressa", "Carlos"],
                    "Categoria 2": ["Luiz"]
                },
                "13:00 - 17:00": {
                    "Categoria 1": ["Antonio"],
                    "Categoria 2": ["Nickolas"]
                }
            };

            novasEscalas["2025-10-14"] = {
                "08:00 - 12:00": {
                    "Categoria 1": ["Marina"],
                    "Categoria 2": ["Paula", "Eduardo"]
                },
                "13:00 - 17:00": {
                    "Categoria 1": ["Rafael"],
                    "Categoria 2": ["Beatriz"]
                }
            };
        }

        setDiasSemana(dias);
        setEscalas(novasEscalas);
    };

    const formatarDataURL = (data) => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };

    const formatarLabel = (data) => {
        const opcoes = { weekday: "short", day: "2-digit", month: "2-digit" };
        return data.toLocaleDateString("pt-BR", opcoes);
    };

    const irParaDia = (data) => {
        navigate(`/escalaDoDia/${data}`);
    };

    const horarios = ["08:00 - 12:00", "13:00 - 17:00"];

    return (
        <div className="container mt-4 escala-semana-page">
            <h2 className="mb-4">Escala da Semana</h2>

            <div className="table-responsive">
                <table className="table table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th rowSpan={2}>Horário</th>
                            {diasSemana.map((dia, idx) => (
                                <th
                                    key={idx}
                                    colSpan={2}
                                    className={dia.isHoje ? "bg-primary text-white" : ""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => irParaDia(dia.data)}
                                >
                                    {dia.label}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {diasSemana.map((_, idx) => ([
                                <th key={`cat1-${idx}`}>Cat. 1</th>,
                                <th key={`cat2-${idx}`}>Cat. 2</th>
                            ]))}
                        </tr>
                    </thead>
                    <tbody>
                        {horarios.map((horario, rowIdx) => (
                            <tr key={rowIdx}>
                                <td className="bg-light text-nowrap"><strong>{horario}</strong></td>

                                {diasSemana.map((dia, colIdx) => {
                                    const escalaDia = escalas[dia.data] || {};
                                    const turno = escalaDia[horario] || {};
                                    return ([
                                        <td key={`c1-${rowIdx}-${colIdx}`} className="text-start text-wrap">
                                            {turno["Categoria 1"]?.map((nome, i) => (
                                                <div key={i}>• {nome}</div>
                                            )) || <span className="text-muted">—</span>}
                                        </td>,
                                        <td key={`c2-${rowIdx}-${colIdx}`} className="text-start text-wrap">
                                            {turno["Categoria 2"]?.map((nome, i) => (
                                                <div key={i}>• {nome}</div>
                                            )) || <span className="text-muted">—</span>}
                                        </td>
                                    ]);
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EscalaDaSemana;
