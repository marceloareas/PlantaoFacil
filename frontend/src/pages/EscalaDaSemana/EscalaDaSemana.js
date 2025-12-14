import { useNavigate } from "react-router-dom";
import { useEffect, useState, React } from "react";
import "./EscalaDaSemana.css";
import 'bootstrap/dist/css/bootstrap.min.css';

const EscalaDaSemana = () => {
    const navigate = useNavigate();
    const [dataReferencia, setDataReferencia] = useState(new Date());
    const [diasSemana, setDiasSemana] = useState([]);
    const [escalas, setEscalas] = useState({});
    const [cargos, setCargos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const data = await res.json();
                setUsuarios(data);
            } catch (err) {
                console.error("Erro ao buscar usuários:", err);
            }
        };
    
        fetchUsuarios();
    }, []);

    const isUsuarioDesativado = (nome) => {
        return usuarios.some(
            (u) => u.nome_completo === nome && u.situacao === "Desativado"
        );
    };
    
    useEffect(() => {
        gerarDiasDaSemana(dataReferencia);
    }, [dataReferencia]);

    const gerarDiasDaSemana = async (referencia) => {
        const dias = [];

        for (let i = -3; i <= 3; i++) {
            const novaData = new Date(referencia);
            novaData.setDate(referencia.getDate() + i);
            const dataFormatada = formatarDataURL(novaData);

            dias.push({
                label: formatarLabel(novaData),
                data: dataFormatada,
                isHoje: isMesmaData(novaData, new Date())
            });
        }

        setDiasSemana(dias);

        const novasEscalas = {};
        const cargosSet = new Set();

        for (const dia of dias) {
            try {
                const response = await fetch(`http://localhost:8000/escaladodia/${dia.data}`);
                const data = await response.json();

                const escalaDia = {};
                data.Escala.forEach(item => {
                    if (!escalaDia[item.Horario]) escalaDia[item.Horario] = {};
                    if (!escalaDia[item.Horario][item.Cargo]) escalaDia[item.Horario][item.Cargo] = [];
                    escalaDia[item.Horario][item.Cargo].push(item.Nome);
                    cargosSet.add(item.Cargo);
                });

                novasEscalas[dia.data] = escalaDia;
            } catch (err) {
                console.error(`Erro ao buscar escala do dia ${dia.data}:`, err);
                novasEscalas[dia.data] = {};
            }
        }

        setEscalas(novasEscalas);
        setCargos(Array.from(cargosSet).sort());
    };

    const formatarDataURL = (data) => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${dia}-${mes}-${ano}`;
    };

    const formatarLabel = (data) => {
        const opcoes = { weekday: "short", day: "2-digit", month: "2-digit" };
        return data.toLocaleDateString("pt-BR", opcoes);
    };

    const isMesmaData = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const irParaDia = (data) => {
        navigate(`/escalaDoDia/${data}`);
    };

    const horarios = ["07:00 - 19:00", "19:00 - 07:00"];

    const proximaSemana = () => {
        const novaData = new Date(dataReferencia);
        novaData.setDate(novaData.getDate() + 7);
        setDataReferencia(novaData);
    };

    const semanaAnterior = () => {
        const novaData = new Date(dataReferencia);
        novaData.setDate(novaData.getDate() - 7);
        setDataReferencia(novaData);
    };

    const voltarParaHoje = () => {
        setDataReferencia(new Date());
    };

    return (
        <div className="container mt-4 escala-semana-page">
            <h2 className="mb-4">Escala da Semana</h2>

            <div className="mb-3 d-flex justify-content-between">
                <button className="btn btn-outline-primary" onClick={semanaAnterior}>← Semana Anterior</button>
                <button className="btn btn-outline-success" onClick={voltarParaHoje}>Semana Atual</button>
                <button className="btn btn-outline-primary" onClick={proximaSemana}>Próxima Semana →</button>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th rowSpan={2}>Horário</th>
                            {diasSemana.map((dia, idx) => (
                                <th
                                    key={idx}
                                    colSpan={cargos.length}
                                    className={dia.isHoje ? "bg-primary text-white" : ""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => irParaDia(dia.data)}
                                >
                                    {dia.label}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {diasSemana.map((_, idx) =>
                                cargos.map((cargo, cIdx) => <th key={`cargo-${idx}-${cIdx}`}>{cargo}</th>)
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {horarios.map((horario, rowIdx) => (
                            <tr key={rowIdx}>
                                <td className="bg-light text-nowrap"><strong>{horario}</strong></td>
                                {diasSemana.map((dia, colIdx) => {
                                    const escalaDia = escalas[dia.data] || {};
                                    const turno = escalaDia[horario] || {};
                                    return cargos.map((cargo, cIdx) => (
                                        <td key={`cell-${rowIdx}-${colIdx}-${cIdx}`} className="text-start text-wrap">
                                            {turno[cargo]?.map((nome, i) => <div  key={i}
                                            style={{
                                                color: isUsuarioDesativado(nome) ? "red" : "inherit",
                                                fontWeight: isUsuarioDesativado(nome) ? "bold" : "normal"
                                            }}>• {nome}</div>) || <span className="text-muted">—</span>}
                                        </td>
                                    ));
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
