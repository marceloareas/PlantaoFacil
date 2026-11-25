import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Row, Spinner, Table } from "react-bootstrap";
import { api, getSetorAtual } from "../../components/api/Api";
import CampoData from "../../components/CampoData";
import { OPCOES_TURNO } from "../../components/EditarPessoaModal";
import { avisar, confirmar } from "../../components/Mensagens";
import { isCargoGestao, isGestor } from "../../components/utils/perfis";
import { formatarData, formatarDataEscala } from "../../components/utils/periodos";

const formularioVazio = (setorId) => ({
    setor_destino_id: setorId ? String(setorId) : "",
    cpf: "",
    turno: "",
    data_inicio: "",
    data_fim: "",
    primeiro_dia: "",
});

const celula = { whiteSpace: "nowrap", verticalAlign: "middle" };

const Emprestimos = ({ user }) => {
    const gestor = isGestor(user);
    const setorAtual = getSetorAtual();

    const [emprestimos, setEmprestimos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [setores, setSetores] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [form, setForm] = useState(formularioVazio(setorAtual?.id));
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    const carregarEmprestimos = useCallback(async () => {
        try {
            setEmprestimos(await api.get("/emprestimos/"));
        } catch (err) {
            setErro(err.message || "Erro ao carregar os empréstimos.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (!gestor) return;
        carregarEmprestimos();
        Promise.all([api.get("/setores/"), api.get("/users/")])
            .then(([listaSetores, usuarios]) => {
                setSetores(listaSetores);
                setFuncionarios(
                    usuarios.filter(
                        (u) => !isCargoGestao(u.cargo) && u.setor_id && u.situacao === "Ativo"
                    )
                );
            })
            .catch((err) => setErro(err.message || "Erro ao carregar setores e funcionários."));
    }, [gestor, carregarEmprestimos]);

    if (!gestor) {
        return <h2>Você não tem permissão para acessar esta página.</h2>;
    }

    const destinoId = Number(form.setor_destino_id);
    const funcionariosDeOutrosSetores = funcionarios
        .filter((f) => f.setor_id !== destinoId)
        .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const funcionarioSelecionado = funcionarios.find((f) => f.cpf === form.cpf);

    const alterar = (e) => {
        const { name, value } = e.target;
        setForm((atual) => {
            const novo = { ...atual, [name]: value };
            if (name === "cpf") {
                // sugere o turno de sempre do funcionário
                const funcionario = funcionarios.find((f) => f.cpf === value);
                novo.turno = funcionario?.turno || atual.turno;
            }
            if (name === "setor_destino_id") {
                const funcionario = funcionarios.find((f) => f.cpf === atual.cpf);
                if (funcionario && funcionario.setor_id === Number(value)) novo.cpf = "";
            }
            return novo;
        });
        setErro("");
    };

    const salvar = async (e) => {
        e.preventDefault();

        if (!form.setor_destino_id || !form.cpf || !form.turno || !form.data_inicio || !form.data_fim) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }
        if (form.data_inicio > form.data_fim) {
            setErro("A data de início não pode ser posterior à data de fim.");
            return;
        }
        const primeiroDia = form.primeiro_dia || form.data_inicio;
        if (primeiroDia < form.data_inicio || primeiroDia > form.data_fim) {
            setErro("O primeiro dia de trabalho deve estar dentro do empréstimo.");
            return;
        }

        const destino = setores.find((s) => s.id === destinoId);
        const continuar = await confirmar(
            `${funcionarioSelecionado.nome_completo} sairá da escala do setor ${funcionarioSelecionado.setor_nome} ` +
            `de ${formatarData(form.data_inicio)} a ${formatarData(form.data_fim)} e será escalado no setor ` +
            `${destino?.nome} no turno ${form.turno}, a partir de ${formatarData(primeiroDia)}.\n\n` +
            "Plantões feitos em dias que, pelo novo ciclo, seriam de descanso passam a contar como extra.\n\n" +
            "Deseja continuar?",
            { titulo: "Confirmar empréstimo", variante: "atencao", textoOk: "Emprestar" }
        );
        if (!continuar) return;

        setSalvando(true);
        try {
            const resultado = await api.post("/emprestimos/", {
                cpf: form.cpf,
                setor_destino_id: destinoId,
                turno: form.turno,
                data_inicio: form.data_inicio,
                data_fim: form.data_fim,
                primeiro_dia: form.primeiro_dia || null,
            });

            const linhas = [
                `${resultado.removidos_origem.length} plantão(ões) retirado(s) da escala do setor ${resultado.setor_origem}.`,
                `${resultado.criados_destino} plantão(ões) criado(s) na escala do setor ${resultado.emprestimo.setor_destino}.`,
            ];
            if (resultado.viraram_extra.length > 0) {
                linhas.push(
                    "Passaram a contar como extra: " +
                    resultado.viraram_extra.map((p) => `${formatarDataEscala(p.data)} (${p.horario})`).join(", ") + "."
                );
            }
            if (resultado.ignorados.length > 0) {
                linhas.push(
                    "Não alocados no setor de destino:\n" +
                    resultado.ignorados.map((p) => `• ${formatarDataEscala(p.data)} (${p.horario}): ${p.motivo}`).join("\n")
                );
            }
            await avisar(linhas.join("\n\n"), {
                titulo: "Empréstimo registrado",
                variante: resultado.ignorados.length > 0 ? "atencao" : "sucesso",
            });

            setForm(formularioVazio(setorAtual?.id));
            carregarEmprestimos();
        } catch (err) {
            setErro(err.message || "Não foi possível registrar o empréstimo.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Container className="my-4" style={{ width: "min(1000px, 95vw)" }}>
            <h2 className="mb-1">Empréstimos de funcionários</h2>
            {setorAtual?.nome && <p className="text-muted mb-4">Setor: {setorAtual.nome}</p>}

            <section className="bg-white rounded shadow-sm p-4 mb-4">
                <h4>Novo empréstimo por intervalo</h4>
                <p className="text-muted">
                    O funcionário sai da escala do próprio setor entre as datas escolhidas e passa a ser escalado no
                    setor de destino, seguindo o regime dele (12x36 ou 12x60) a partir do primeiro dia de trabalho.
                    Para cobrir um único plantão sem mexer na escala do setor dele, use a tela de edição da escala
                    do dia, em "Emprestar de outro setor".
                </p>

                {erro && <Alert variant="danger" dismissible onClose={() => setErro("")}>{erro}</Alert>}

                <Form onSubmit={salvar}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-destino">
                                <Form.Label>Setor de destino</Form.Label>
                                <Form.Select name="setor_destino_id" value={form.setor_destino_id} onChange={alterar} required>
                                    <option value="">Selecione o setor</option>
                                    {setores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-funcionario">
                                <Form.Label>Funcionário</Form.Label>
                                <Form.Select name="cpf" value={form.cpf} onChange={alterar} required disabled={!form.setor_destino_id}>
                                    <option value="">Selecione o funcionário</option>
                                    {funcionariosDeOutrosSetores.map((f) => (
                                        <option key={f.cpf} value={f.cpf}>
                                            {f.nome_completo} ({f.setor_nome} — {f.cargo}, {f.horaEscala})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-inicio">
                                <Form.Label>Início do empréstimo</Form.Label>
                                <CampoData id="emprestimo-inicio" name="data_inicio" value={form.data_inicio} onChange={alterar} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-fim">
                                <Form.Label>Fim do empréstimo</Form.Label>
                                <CampoData id="emprestimo-fim" name="data_fim" value={form.data_fim} onChange={alterar} min={form.data_inicio || undefined} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-turno">
                                <Form.Label>Turno no setor de destino</Form.Label>
                                <Form.Select name="turno" value={form.turno} onChange={alterar} required>
                                    <option value="">Selecione o turno</option>
                                    {OPCOES_TURNO.map((t) => (
                                        <option key={t.valor} value={t.valor}>{t.rotulo}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="emprestimo-primeiro-dia">
                                <Form.Label>Primeiro dia de trabalho no destino (opcional)</Form.Label>
                                <CampoData
                                    id="emprestimo-primeiro-dia"
                                    name="primeiro_dia"
                                    value={form.primeiro_dia}
                                    onChange={alterar}
                                    min={form.data_inicio || undefined}
                                    max={form.data_fim || undefined}
                                />
                                <Form.Text muted>Se ficar vazio, é o próprio início do empréstimo.</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <Button type="submit" variant="primary" disabled={salvando}>
                            {salvando ? "Salvando..." : "Registrar empréstimo"}
                        </Button>
                    </div>
                </Form>
            </section>

            <section className="bg-white rounded shadow-sm p-4">
                <h4>Empréstimos deste setor</h4>
                <p className="text-muted">Empréstimos em que este setor cede ou recebe funcionários.</p>

                {carregando ? (
                    <div className="text-center my-3"><Spinner animation="border" /></div>
                ) : emprestimos.length === 0 ? (
                    <p className="mb-0">Nenhum empréstimo registrado.</p>
                ) : (
                    <Table bordered hover responsive className="mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th style={celula}>Funcionário</th>
                                <th style={celula}>De</th>
                                <th style={celula}>Para</th>
                                <th style={celula}>Início</th>
                                <th style={celula}>Fim</th>
                                <th style={celula}>Turno</th>
                                <th style={celula}>1º dia no destino</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emprestimos.map((e) => (
                                <tr key={e.id}>
                                    <td style={celula}>{e.nome}</td>
                                    <td style={celula}>{e.setor_origem}</td>
                                    <td style={celula}>{e.setor_destino}</td>
                                    <td style={celula}>{formatarData(e.data_inicio)}</td>
                                    <td style={celula}>{formatarData(e.data_fim)}</td>
                                    <td style={celula}>{e.turno}</td>
                                    <td style={celula}>{formatarData(e.primeiro_dia)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </section>
        </Container>
    );
};

export default Emprestimos;
