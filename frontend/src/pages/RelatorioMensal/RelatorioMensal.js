import { useState } from "react";
import { api } from "../../components/api/Api";
import "bootstrap/dist/css/bootstrap.min.css";
import "./RelatorioMensal.css";

function RelatorioMensal() {

    const [dataInicial, setDataInicial] = useState("");
    const [dadosRelatorio, setDadosRelatorio] = useState({});
    const [loading, setLoading] = useState(false);

    const horarios = [
        "07:00 - 19:00",
        "19:00 - 07:00"
    ];

    const gerarResumoFuncionarios = () => {
        const contagem = {};

        Object.values(dadosRelatorio.escalas || {}).forEach(dia => {

            dia.forEach(item => {

                if (!contagem[item.Nome]) {
                    contagem[item.Nome] = {
                        cargo: item.Cargo,
                        quantidade: 0
                    };
                }

                contagem[item.Nome].quantidade++;

            });

        });

        return Object.entries(contagem)
            .map(([nome, dados]) => ({
                nome,
                cargo: dados.cargo,
                quantidade: dados.quantidade
            }))
            .sort((a, b) => b.quantidade - a.quantidade);
    };

    const resumoFuncionarios = gerarResumoFuncionarios();

    const formatarDataURL = (data) => {
        const d = String(data.getDate()).padStart(2, "0");
        const m = String(data.getMonth() + 1).padStart(2, "0");
        const y = data.getFullYear();

        return `${d}-${m}-${y}`;
    };

    const calcularDataFinal = () => {

        if (!dataInicial) return "";

        const inicio = new Date(dataInicial);

        const ultimoDia = new Date(
            inicio.getFullYear(),
            inicio.getMonth() + 1,
            0
        );

        return ultimoDia.toLocaleDateString("pt-BR");
    };

    const sugerirMesAtual = () => {

        const hoje = new Date();

        setDataInicial(
            hoje.toISOString().split("T")[0]
        );
    };

    const gerarRelatorio = async () => {

        if (!dataInicial) {
            alert("Selecione uma data.");
            return;
        }

        setLoading(true);

        try {

            const inicio = new Date(dataInicial);

            const ultimoDiaMes = new Date(
                inicio.getFullYear(),
                inicio.getMonth() + 1,
                0
            ).getDate();

            const diasMes = [];

            for (let i = 1; i <= ultimoDiaMes; i++) {

                const d = new Date(
                    inicio.getFullYear(),
                    inicio.getMonth(),
                    i
                );

                diasMes.push({
                    data: formatarDataURL(d),
                    label: d.toLocaleDateString(
                        "pt-BR",
                        {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit"
                        }
                    )
                });
            }

            const escalas = {};

            for (const dia of diasMes) {

                try {

                    const resposta = await api.get(
                        `/escaladodia/${dia.data}`
                    );

                    escalas[dia.data] =
                        resposta?.Escala || [];

                } catch {

                    escalas[dia.data] = [];
                }
            }

            const semanas = [];

            for (
                let i = 0;
                i < diasMes.length;
                i += 7
            ) {

                semanas.push(
                    diasMes.slice(i, i + 7)
                );
            }

            setDadosRelatorio({
                semanas,
                escalas
            });

        } catch (erro) {

            console.error(erro);
            alert("Erro ao gerar relatório.");

        } finally {

            setLoading(false);
        }
    };

    const imprimirRelatorio = () => {

        const tabela =
            document.querySelector(
                ".area-impressao"
            );

        const janela = window.open(
            "",
            "",
            "width=1200,height=800"
        );

        janela.document.write(`
            <html>
            <head>
                <title>Relatório Mensal</title>

                <style>

                    body{
                        font-family: Arial;
                        margin:20px;
                    }

                    h1{
                        text-align:center;
                        margin-bottom:20px;
                    }

                    table{
                        width:100%;
                        border-collapse:collapse;
                    }

                    th,td{
                        border:1px solid black;
                        padding:8px;
                        text-align:center;
                        vertical-align:top;
                    }

                    th{
                        background:#f0f0f0;
                    }

                </style>
            </head>

            <body>

                <h1>
                    Relatório Mensal
                </h1>

                ${tabela.innerHTML}

            </body>

            </html>
        `);

        janela.document.close();

        setTimeout(() => {

            janela.print();
            janela.close();

        }, 500);
    };

    return (

        <div className="container-fluid mt-4">

            <h2>Relatório Mensal</h2>

            <div className="row mt-3">

                <div className="col-md-4">

                    <label>
                        Data Inicial
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        value={dataInicial}
                        onChange={(e) =>
                            setDataInicial(
                                e.target.value
                            )
                        }
                    />

                </div>

                <div className="col-md-4">

                    <label>
                        Data Final
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        value={calcularDataFinal()}
                        disabled
                    />

                </div>

            </div>

            <div className="mt-3">

                <button
                    className="btn btn-outline-success me-2"
                    onClick={sugerirMesAtual}
                >
                    Mês Atual
                </button>

                <button
                    className="btn btn-primary me-2"
                    onClick={gerarRelatorio}
                >
                    Gerar Relatório
                </button>

                {dadosRelatorio.semanas && (

                    <button
                        className="btn btn-danger"
                        onClick={imprimirRelatorio}
                    >
                        Imprimir / PDF
                    </button>

                )}

            </div>

            {loading && (

                <div className="mt-4">
                    Carregando...
                </div>

            )}

            {!loading &&
                dadosRelatorio.semanas && (

                <div className="area-impressao mt-4">

                    {dadosRelatorio.semanas.map(
                        (
                            semana,
                            indiceSemana
                        ) => (

                        <div
                            key={indiceSemana}
                            className="mb-5"
                        >

                            <h4>
                                Semana {indiceSemana + 1}
                            </h4>

                            <table className="table table-bordered text-center">

                                <thead className="table-light">

                                    <tr>

                                        <th>
                                            Horário
                                        </th>

                                        {semana.map(
                                            (dia) => (

                                            <th
                                                key={
                                                    dia.data
                                                }
                                            >
                                                {
                                                    dia.label
                                                }
                                            </th>

                                        ))}

                                        

                                    </tr>

                                </thead>

                                <tbody>

                                    {horarios.map(
                                        (
                                            horario
                                        ) => (

                                        <tr
                                            key={
                                                horario
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        horario
                                                    }
                                                </strong>
                                            </td>

                                            {semana.map(
                                                (
                                                    dia
                                                ) => {

                                                const funcionarios =
                                                    dadosRelatorio
                                                        .escalas[
                                                            dia.data
                                                        ]
                                                        ?.filter(
                                                            item =>
                                                                item.Horario ===
                                                                horario
                                                        );

                                                return (

                                                    <td
                                                        key={
                                                            dia.data
                                                        }
                                                    >

                                                        {funcionarios &&
                                                        funcionarios.length >
                                                            0 ? (

                                                            funcionarios.map(
                                                                (
                                                                    func,
                                                                    index
                                                                ) => (

                                                                <div
                                                                    key={
                                                                        index
                                                                    }
                                                                >
                                                                    •{" "}
                                                                    {
                                                                        func.Nome
                                                                    }

                                                                    <br />

                                                                    <small>
                                                                        {
                                                                            func.Cargo
                                                                        }
                                                                    </small>
                                                                </div>

                                                            )
                                                            )

                                                        ) : (

                                                            <span className="text-muted">
                                                                —
                                                            </span>

                                                        )}

                                                    </td>

                                                );

                                            })}

                                        </tr>

                                    ))}

                                </tbody>

                            </table>
                        
                            
                        </div>

                        

                    ))}


                    <div className="mt-5">

                        <h3>Resumo Geral do Mês</h3>

                        <table className="table table-bordered">

                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Cargo</th>
                                    <th>Total de Plantões</th>
                                </tr>
                            </thead>

                            <tbody>

                                {resumoFuncionarios.map(
                                    (funcionario, index) => (

                                    <tr key={index}>
                                        <td>{funcionario.nome}</td>
                                        <td>{funcionario.cargo}</td>
                                        <td>{funcionario.quantidade}</td>
                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>


                </div>

            )}

        </div>

    );
}

export default RelatorioMensal;