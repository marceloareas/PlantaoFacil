import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import "./Periodos.css";
import { api, getSetorAtual } from "../../components/api/Api";
import CriarPeriodoModal from "../../components/CriarPeriodoModal";
import { isGestor } from "../../components/utils/perfis";
import {
    descreverPeriodo,
    diaSeguinteISO,
    formatarData,
    formatarDataEscala,
    formatarDataHora,
} from "../../components/utils/periodos";

const Carregando = () => (
    <div className="text-center my-3"><Spinner animation="border" /></div>
);

const Mensagem = ({ msg, onClose }) =>
    msg ? <Alert variant={msg.variant} dismissible onClose={onClose}>{msg.texto}</Alert> : null;

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

const ResumoGeracao = ({ resumo, onClose }) => {
    const funcionarios = resumo.funcionarios || [];
    const ignorados = resumo.ignorados || [];
    const semConfiguracao = resumo.sem_configuracao || [];

    return (
        <div className="periodos-resumo mt-4">
            <div className="periodos-secao-topo">
                <h5>Resultado da geração ({descreverPeriodo(resumo.periodo)})</h5>
                <Button size="sm" variant="outline-secondary" onClick={onClose}>Fechar</Button>
            </div>

            <Alert variant={resumo.criados > 0 ? "success" : "info"}>
                {resumo.criados > 0
                    ? `${plural(resumo.criados, "plantão criado", "plantões criados")} na escala do período.`
                    : "Nenhum plantão novo foi criado."}
            </Alert>

            {semConfiguracao.length > 0 && (
                <Alert variant="warning">
                    <strong>{plural(semConfiguracao.length, "funcionário sem configuração", "funcionários sem configuração")}</strong>
                    {" "}(não foram escalados):
                    <ul className="mb-2">
                        {semConfiguracao.map((f) => (
                            <li key={f.cpf}>{f.nome}: {f.motivo}</li>
                        ))}
                    </ul>
                    Preencha o turno e o início do ciclo no cadastro em{" "}
                    <Link to="/Pessoas" className="alert-link">Funcionários</Link> e depois gere a escala
                    do período de novo.
                </Alert>
            )}

            {funcionarios.length > 0 && (
                <>
                    <h6>Por funcionário</h6>
                    <div className="periodos-rolagem mb-3">
                        <Table bordered hover size="sm" responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Plantões criados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funcionarios.map((f) => (
                                    <tr key={f.cpf}>
                                        <td>{f.nome}</td>
                                        <td>{f.plantoes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}

            {ignorados.length > 0 && (
                <>
                    <h6>Plantões não alocados ({ignorados.length})</h6>
                    <div className="periodos-rolagem">
                        <Table bordered hover size="sm" responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Data</th>
                                    <th>Turno</th>
                                    <th>Funcionário</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ignorados.map((item) => (
                                    <tr key={`${item.cpf}-${item.data}-${item.horario}`}>
                                        <td>{formatarDataEscala(item.data)}</td>
                                        <td>{item.horario}</td>
                                        <td>{item.nome}</td>
                                        <td>{item.motivo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
};

const Periodos = ({ user }) => {
    const gestor = isGestor(user);
    const setorAtual = getSetorAtual();
    const setorId = setorAtual?.id;

    const [periodos, setPeriodos] = useState([]);
    const [carregandoPeriodos, setCarregandoPeriodos] = useState(true);
    const [msgPeriodos, setMsgPeriodos] = useState(null);
    const [showNovoPeriodo, setShowNovoPeriodo] = useState(false);
    const [confirmacao, setConfirmacao] = useState({ show: false, periodo: null });
    const [gerando, setGerando] = useState(false);
    const [resumo, setResumo] = useState(null);

    const [limites, setLimites] = useState({ max_extras_periodo: "", max_trocas_periodo: "" });
    const [limitesCarregados, setLimitesCarregados] = useState(false);
    const [carregandoLimites, setCarregandoLimites] = useState(true);
    const [salvandoLimites, setSalvandoLimites] = useState(false);
    const [msgLimites, setMsgLimites] = useState(null);

    const [selecionadoId, setSelecionadoId] = useState(null);
    // incrementado para recarregar o uso depois de gerar a escala ou mudar os limites
    const [versaoUso, setVersaoUso] = useState(0);
    const [uso, setUso] = useState(null);
    const [carregandoUso, setCarregandoUso] = useState(false);
    const [erroUso, setErroUso] = useState("");

    const [faltas, setFaltas] = useState([]);
    const [carregandoFaltas, setCarregandoFaltas] = useState(false);
    const [msgFaltas, setMsgFaltas] = useState(null);

    const periodoSelecionado = periodos.find((p) => p.id === selecionadoId) || null;
    const inicioSelecionado = periodoSelecionado?.data_inicio;
    const fimSelecionado = periodoSelecionado?.data_fim;

    const carregarPeriodos = useCallback(async () => {
        try {
            const lista = await api.get("/periodos/");
            setPeriodos(lista);
            setSelecionadoId((atual) => {
                if (lista.some((p) => p.id === atual)) return atual;
                const padrao = lista.find((p) => p.vigente) || lista[0];
                return padrao ? padrao.id : null;
            });
        } catch (err) {
            setMsgPeriodos({ variant: "danger", texto: err.message || "Erro ao carregar os períodos." });
        } finally {
            setCarregandoPeriodos(false);
        }
    }, []);

    useEffect(() => {
        if (gestor) carregarPeriodos();
    }, [gestor, carregarPeriodos]);

    useEffect(() => {
        if (!gestor) return;
        api.get("/setores/")
            .then((setores) => {
                const setor = setores.find((s) => s.id === setorId);
                if (!setor) {
                    setMsgLimites({ variant: "danger", texto: "Setor atual não encontrado." });
                    return;
                }
                setLimites({
                    max_extras_periodo: String(setor.max_extras_periodo ?? ""),
                    max_trocas_periodo: String(setor.max_trocas_periodo ?? ""),
                });
                setLimitesCarregados(true);
            })
            .catch((err) => setMsgLimites({ variant: "danger", texto: err.message || "Erro ao carregar os limites do setor." }))
            .finally(() => setCarregandoLimites(false));
    }, [gestor, setorId]);

    useEffect(() => {
        if (!gestor || !selecionadoId) {
            setUso(null);
            return;
        }
        let ativo = true;
        setCarregandoUso(true);
        setErroUso("");
        api.get(`/avisos/?periodo_id=${selecionadoId}`)
            .then((data) => {
                if (ativo) setUso(data);
            })
            .catch((err) => {
                if (!ativo) return;
                setUso(null);
                setErroUso(err.message || "Erro ao carregar o uso do período.");
            })
            .finally(() => {
                if (ativo) setCarregandoUso(false);
            });
        return () => {
            ativo = false;
        };
    }, [gestor, selecionadoId, versaoUso]);

    useEffect(() => {
        if (!gestor || !inicioSelecionado || !fimSelecionado) {
            setFaltas([]);
            return;
        }
        let ativo = true;
        setCarregandoFaltas(true);
        setMsgFaltas(null);
        api.get(`/faltas/?inicio=${inicioSelecionado}&fim=${fimSelecionado}`)
            .then((data) => {
                if (ativo) setFaltas(data || []);
            })
            .catch((err) => {
                if (!ativo) return;
                setFaltas([]);
                setMsgFaltas({ variant: "danger", texto: err.message || "Erro ao carregar as faltas do período." });
            })
            .finally(() => {
                if (ativo) setCarregandoFaltas(false);
            });
        return () => {
            ativo = false;
        };
    }, [gestor, inicioSelecionado, fimSelecionado]);

    if (!gestor) {
        return <h2>Você não tem permissão para acessar esta página.</h2>;
    }

    const fimMaisRecente = periodos.reduce((maior, p) => (p.data_fim > maior ? p.data_fim : maior), "");
    const sugestaoInicio = fimMaisRecente ? diaSeguinteISO(fimMaisRecente) : undefined;

    const periodoCriado = (periodo) => {
        setMsgPeriodos({
            variant: "success",
            texto: `Período de ${descreverPeriodo(periodo)} criado. Agora gere a escala do período.`,
        });
        carregarPeriodos();
    };

    const fecharConfirmacao = () => {
        if (!gerando) setConfirmacao((atual) => ({ ...atual, show: false }));
    };

    const gerarEscala = async () => {
        const periodo = confirmacao.periodo;
        setGerando(true);
        try {
            const resultado = await api.post(`/periodos/${periodo.id}/gerar-escala`);
            setResumo(resultado);
            setMsgPeriodos(null);
            carregarPeriodos();
            setVersaoUso((v) => v + 1);
        } catch (err) {
            setMsgPeriodos({ variant: "danger", texto: err.message || "Não foi possível gerar a escala do período." });
        } finally {
            setGerando(false);
            setConfirmacao((atual) => ({ ...atual, show: false }));
        }
    };

    const excluirPeriodo = async (periodo) => {
        if (!window.confirm(`Deseja realmente excluir o período de ${descreverPeriodo(periodo)}?`)) return;

        try {
            const resposta = await api.delete(`/periodos/${periodo.id}`);
            setMsgPeriodos({ variant: "success", texto: resposta?.message || "Período excluído." });
            carregarPeriodos();
        } catch (err) {
            setMsgPeriodos({ variant: "danger", texto: err.message || "Não foi possível excluir o período." });
        }
    };

    const alterarLimite = (e) => {
        const { name, value } = e.target;
        setLimites((atual) => ({ ...atual, [name]: value }));
    };

    const salvarLimites = async (e) => {
        e.preventDefault();
        const extras = Number(limites.max_extras_periodo);
        const trocas = Number(limites.max_trocas_periodo);
        const valido = (texto, n) => texto !== "" && Number.isInteger(n) && n >= 0 && n <= 999;

        if (!valido(limites.max_extras_periodo, extras) || !valido(limites.max_trocas_periodo, trocas)) {
            setMsgLimites({ variant: "danger", texto: "Informe números inteiros entre 0 e 999." });
            return;
        }

        setSalvandoLimites(true);
        try {
            const setor = await api.put(`/setores/${setorId}/parametros`, {
                max_extras_periodo: extras,
                max_trocas_periodo: trocas,
            });
            setLimites({
                max_extras_periodo: String(setor?.max_extras_periodo ?? extras),
                max_trocas_periodo: String(setor?.max_trocas_periodo ?? trocas),
            });
            setMsgLimites({ variant: "success", texto: "Limites salvos." });
            setVersaoUso((v) => v + 1);
        } catch (err) {
            setMsgLimites({ variant: "danger", texto: err.message || "Não foi possível salvar os limites." });
        } finally {
            setSalvandoLimites(false);
        }
    };

    const removerFalta = async (falta) => {
        const descricao = `${falta.nome} em ${formatarData(falta.data)} (${falta.horario})`;
        if (!window.confirm(`Deseja realmente remover a falta de ${descricao}?`)) return;

        try {
            await api.delete(`/faltas/${falta.id}`);
            setFaltas((lista) => lista.filter((f) => f.id !== falta.id));
            setMsgFaltas({ variant: "success", texto: `Falta de ${descricao} removida.` });
        } catch (err) {
            setMsgFaltas({ variant: "danger", texto: err.message || "Não foi possível remover a falta." });
        }
    };

    const periodoConfirmacao = confirmacao.periodo;
    const confirmacaoJaGerada = Boolean(periodoConfirmacao?.escala_gerada_em);
    const limitesUso = uso?.limites || {};
    const avisos = uso?.avisos || [];
    const funcionariosUso = uso?.funcionarios || [];

    return (
        <Container className="periodos-page my-4">
            <h2 className="mb-1">Períodos e escala</h2>
            {setorAtual?.nome && <p className="text-muted mb-4">Setor: {setorAtual.nome}</p>}

            <section className="periodos-secao">
                <div className="periodos-secao-topo">
                    <h4>Períodos do setor</h4>
                    <Button variant="success" onClick={() => setShowNovoPeriodo(true)}>
                        Novo período
                    </Button>
                </div>
                <p className="text-muted">
                    Cada período começa no dia escolhido e termina no dia anterior ao mesmo dia do mês seguinte.
                    Gerar a escala aloca todos os funcionários ativos do setor nos seus dias de trabalho.
                </p>

                <Mensagem msg={msgPeriodos} onClose={() => setMsgPeriodos(null)} />

                {carregandoPeriodos ? (
                    <Carregando />
                ) : periodos.length === 0 ? (
                    <p className="mb-0">Nenhum período cadastrado neste setor.</p>
                ) : (
                    <Table bordered hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Início</th>
                                <th>Fim</th>
                                <th>Escala gerada em</th>
                                <th style={{ width: "1%", whiteSpace: "nowrap" }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periodos.map((periodo) => (
                                <tr key={periodo.id}>
                                    <td>
                                        {formatarData(periodo.data_inicio)}
                                        {periodo.vigente && <Badge bg="success" className="ms-2">Vigente</Badge>}
                                    </td>
                                    <td>{formatarData(periodo.data_fim)}</td>
                                    <td>
                                        {periodo.escala_gerada_em
                                            ? formatarDataHora(periodo.escala_gerada_em)
                                            : <Badge bg="secondary">Não gerada</Badge>}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={periodo.escala_gerada_em ? "outline-primary" : "primary"}
                                                style={{ whiteSpace: "nowrap" }}
                                                onClick={() => setConfirmacao({ show: true, periodo })}
                                            >
                                                {periodo.escala_gerada_em ? "Completar escala" : "Gerar escala"}
                                            </Button>
                                            {!periodo.escala_gerada_em && (
                                                <Button size="sm" variant="danger" onClick={() => excluirPeriodo(periodo)}>
                                                    Excluir
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                {resumo && <ResumoGeracao resumo={resumo} onClose={() => setResumo(null)} />}
            </section>

            <section className="periodos-secao">
                <h4>Limites do setor</h4>
                <p className="text-muted">
                    Quantidade máxima por funcionário em cada período. Quem passar do limite gera um aviso
                    para os gestores, mas nada é bloqueado.
                </p>

                <Mensagem msg={msgLimites} onClose={() => setMsgLimites(null)} />

                {carregandoLimites ? (
                    <Carregando />
                ) : limitesCarregados && (
                    <Form onSubmit={salvarLimites}>
                        <Row className="g-3 align-items-end">
                            <Col sm={5}>
                                <Form.Group controlId="limite-extras">
                                    <Form.Label>Plantões extras por período</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="max_extras_periodo"
                                        min={0}
                                        max={999}
                                        step={1}
                                        value={limites.max_extras_periodo}
                                        onChange={alterarLimite}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={5}>
                                <Form.Group controlId="limite-trocas">
                                    <Form.Label>Trocas solicitadas por período</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="max_trocas_periodo"
                                        min={0}
                                        max={999}
                                        step={1}
                                        value={limites.max_trocas_periodo}
                                        onChange={alterarLimite}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={2}>
                                <Button type="submit" variant="primary" className="w-100" disabled={salvandoLimites}>
                                    {salvandoLimites ? "Salvando..." : "Salvar"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                )}
            </section>

            <section className="periodos-secao">
                <div className="periodos-secao-topo">
                    <h4>Uso do período</h4>
                    {periodos.length > 0 && (
                        <Form.Select
                            className="periodos-seletor"
                            aria-label="Período"
                            value={selecionadoId ?? ""}
                            onChange={(e) => setSelecionadoId(Number(e.target.value))}
                        >
                            {periodos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {descreverPeriodo(p)}{p.vigente ? " (vigente)" : ""}
                                </option>
                            ))}
                        </Form.Select>
                    )}
                </div>
                <p className="text-muted">
                    Extras são plantões incluídos depois que a escala do período foi gerada. Trocas são as
                    solicitadas pelo funcionário (as recusadas não contam).
                </p>

                {!periodoSelecionado ? (
                    !carregandoPeriodos && (
                        <p className="mb-0">Crie um período para acompanhar os extras e as trocas dos funcionários.</p>
                    )
                ) : carregandoUso ? (
                    <Carregando />
                ) : erroUso ? (
                    <Alert variant="danger" className="mb-0">{erroUso}</Alert>
                ) : uso && (
                    <>
                        {avisos.length > 0 ? (
                            <Alert variant="warning">
                                <strong>{avisos.length} aviso(s) de limite neste período:</strong>
                                <ul className="mb-0">
                                    {avisos.map((aviso) => (
                                        <li key={`${aviso.cpf}-${aviso.tipo}`}>{aviso.mensagem}</li>
                                    ))}
                                </ul>
                            </Alert>
                        ) : (
                            <Alert variant="success">Nenhum funcionário passou dos limites neste período.</Alert>
                        )}

                        {funcionariosUso.length === 0 ? (
                            <p className="mb-0">Nenhum funcionário neste setor.</p>
                        ) : (
                            <Table bordered hover responsive className="mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Funcionário</th>
                                        <th>Extras</th>
                                        <th>Trocas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {funcionariosUso.map((f) => {
                                        const extrasAcima = f.extras > limitesUso.max_extras_periodo;
                                        const trocasAcima = f.trocas > limitesUso.max_trocas_periodo;
                                        return (
                                            <tr key={f.cpf} className={extrasAcima || trocasAcima ? "table-danger" : undefined}>
                                                <td>{f.nome}</td>
                                                <td className={extrasAcima ? "fw-bold" : undefined}>
                                                    {f.extras} / {limitesUso.max_extras_periodo}
                                                </td>
                                                <td className={trocasAcima ? "fw-bold" : undefined}>
                                                    {f.trocas} / {limitesUso.max_trocas_periodo}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </>
                )}
            </section>

            <section className="periodos-secao">
                <h4>Faltas do período</h4>
                <p className="text-muted">
                    {periodoSelecionado && <>Período de {descreverPeriodo(periodoSelecionado)}. </>}
                    Para registrar uma falta, clique no nome do funcionário na escala.
                </p>

                <Mensagem msg={msgFaltas} onClose={() => setMsgFaltas(null)} />

                {!periodoSelecionado ? null : carregandoFaltas ? (
                    <Carregando />
                ) : faltas.length === 0 ? (
                    <p className="mb-0">Nenhuma falta registrada neste período.</p>
                ) : (
                    <Table bordered hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Data</th>
                                <th>Turno</th>
                                <th>Funcionário</th>
                                <th>Observação</th>
                                <th>Registrada por</th>
                                <th style={{ width: "1%", whiteSpace: "nowrap" }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {faltas.map((falta) => (
                                <tr key={falta.id}>
                                    <td>{formatarData(falta.data)}</td>
                                    <td>{falta.horario}</td>
                                    <td>{falta.nome}</td>
                                    <td>{falta.observacao}</td>
                                    <td>{falta.registrado_por}</td>
                                    <td>
                                        <Button size="sm" variant="danger" onClick={() => removerFalta(falta)}>
                                            Remover
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </section>

            <CriarPeriodoModal
                show={showNovoPeriodo}
                onClose={() => setShowNovoPeriodo(false)}
                onCreated={periodoCriado}
                sugestaoInicio={sugestaoInicio}
            />

            <Modal show={confirmacao.show} onHide={fecharConfirmacao} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{confirmacaoJaGerada ? "Completar escala" : "Gerar escala"}</Modal.Title>
                </Modal.Header>
                {periodoConfirmacao && (
                    <Modal.Body>
                        <p>Período de <strong>{descreverPeriodo(periodoConfirmacao)}</strong>.</p>
                        {confirmacaoJaGerada ? (
                            <p>
                                A escala deste período já foi gerada em {formatarDataHora(periodoConfirmacao.escala_gerada_em)}.
                                Gerar de novo só inclui quem ainda não tem plantões neste período (por exemplo, um
                                funcionário novo ou que teve o cadastro completado). A escala de quem já está no período
                                não muda, e plantões removidos à mão não voltam.
                            </p>
                        ) : (
                            <p>
                                Todos os funcionários ativos do setor serão escalados nos seus dias de trabalho, de acordo
                                com o turno, o início do ciclo e o regime (12x36 ou 12x60) do cadastro de cada um.
                                Plantões que já estão na escala são mantidos.
                            </p>
                        )}
                        <ul className="mb-0">
                            <li>
                                Dias com indisponibilidade, escala em outro setor no mesmo turno ou que formariam
                                3 turnos seguidos ficam de fora e aparecem no resumo.
                            </li>
                            <li>Funcionários sem turno ou início do ciclo no cadastro não são escalados.</li>
                            {!confirmacaoJaGerada && (
                                <li>
                                    Depois da geração, plantões incluídos neste período contam como extras e o período
                                    não pode mais ser excluído.
                                </li>
                            )}
                        </ul>
                    </Modal.Body>
                )}
                <Modal.Footer>
                    <Button variant="secondary" onClick={fecharConfirmacao} disabled={gerando}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={gerarEscala} disabled={gerando || !periodoConfirmacao}>
                        {gerando ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Gerando...
                            </>
                        ) : confirmacaoJaGerada ? "Completar escala" : "Gerar escala"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Periodos;
