import { useState, useEffect } from "react";
import EditarPessoa, { OPCOES_TURNO } from "../../components/EditarPessoaModal";
import AdicionarTurno from "../../components/AdicionarTurnoModal";
import { Spinner, Alert, Table, Button, Container, Row, Col, Form, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Pessoas.css";
import { api, getSetorAtual } from "../../components/api/Api";
import { isAdmin, isCargoGestao, isGestor } from "../../components/utils/perfis";

const NAO_DEFINIDO = "Não definido";

const formatarTurno = (turno) => {
    const opcao = OPCOES_TURNO.find((t) => t.valor === turno);
    return opcao ? opcao.rotulo.split(" ")[0] : NAO_DEFINIDO;
};

// "AAAA-MM-DD" para "dd/mm/aaaa" sem passar por Date (evita erro de fuso)
const formatarInicioCiclo = (data) => {
    if (!data) return NAO_DEFINIDO;
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
};

const formatDateBR = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const getEscalasFuturasDoUsuario = async (nomeCompleto, Cpf, setorId, diasBusca = 90) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const datasComEscala = [];
    const opcoes = setorId ? { headers: { "X-Setor-Id": String(setorId) } } : undefined;

    for (let i = 1; i <= diasBusca; i++) {
        const data = addDays(hoje, i);
        const dataBR = formatDateBR(data);

        try {
            const dataRes = await api.get(`/escaladodia/${dataBR}`, opcoes);
            const escala = dataRes?.Escala || [];

            const estaEscalado = escala.some((e) => e.Cpf === Cpf);

            if (estaEscalado) {
                datasComEscala.push(dataBR);
            }
        } catch {
            // ignora dias sem escala / Ñ Tirar
            continue;
        }
    }

    return datasComEscala;
};

const Pessoas = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [showModalpessoa, setShowModalPessoa] = useState(false);
    const [showModalTurnos, setShowModalTurnos] = useState(false);
    const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
    const [filtro, setFiltro] = useState("");
    const [user, setUser] = useState(null);
    const [setores, setSetores] = useState([]);
    const [filtroSetor, setFiltroSetor] = useState(String(getSetorAtual()?.id ?? "todos"));

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (!isGestor(parsedUser)) {
                setErro("Você não tem permissão para acessar esta página.");
                setLoading(false);
            }
        } else {
            setErro("Usuário não autenticado. Faça login novamente.");
            setLoading(false);
        }
    }, []);

    
    useEffect(() => {
        const fetchUsuarios = async () => {
            if (!isGestor(user)) return;

            try {
                const [data, listaSetores] = await Promise.all([api.get("/users/"), api.get("/setores/")]);
                setUsuarios(data);
                setSetores(listaSetores);
            } catch {
                setErro("Não foi possível carregar os funcionários.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, [user]);

    const abrirModalpessoa = (pessoa) => {
        setPessoaSelecionada(pessoa);
        setShowModalPessoa(true);
    };

    const abrirModalTurnos = (pessoa) => {
        setPessoaSelecionada(pessoa);
        setShowModalTurnos(true);
    }

    const handleSave = (updatedPessoa) => {
        setUsuarios((prev) =>
            prev.map((u) => (u.id === updatedPessoa.user.id ? updatedPessoa.user : u))
        );
    };

    
    const alternarStatusUsuario = async (usuario) => {
        const novoStatus = usuario.situacao === "Ativo" ? "Desativado" : "Ativo";

        if (novoStatus === "Desativado") {
            const datasEscaladas = await getEscalasFuturasDoUsuario(
                usuario.nome_completo,
                usuario.cpf,
                usuario.setor_id,
                90
            );

            if (datasEscaladas.length > 0) {
                const listaDatas = datasEscaladas
                    .map((d) => d.replaceAll("-", "/"))
                    .join(", ");

                const confirmar = window.confirm(
                    `${usuario.nome_completo} está escalado nas seguintes datas:\n` +
                    `${listaDatas}\n` +
                    `Deseja realmente desativar este funcionário?`
                );

                if (!confirmar) return;
            }
        }

        const datasEscaladas = await getEscalasFuturasDoUsuario(
            usuario.nome_completo,
            usuario.cpf,
            usuario.setor_id,
            90
        );
        if (datasEscaladas.length == 0 && 
            !window.confirm(
                `Deseja realmente alterar o status de ${usuario.nome_completo} para ${novoStatus}?`
            )
        )
            return;

        try {
            await api.put(`/users/${usuario.id}`, {
                ...usuario,
                situacao: novoStatus,
            });

            setUsuarios((prev) =>
                prev.map((u) =>
                    u.id === usuario.id ? { ...u, situacao: novoStatus } : u
                )
            );

        } catch(err) {
            console.log(err)
            alert(err.message || "Erro de conexão com o servidor");
        }
    };

    // só o admin altera coordenadores e admins
    const podeEditar = (pessoa) => isAdmin(user) || !isCargoGestao(pessoa.cargo);

    
    const usuariosFiltrados = usuarios.filter((user) => {
        if (filtroSetor === "sem" && user.setor_id) return false;
        if (filtroSetor !== "todos" && filtroSetor !== "sem" && String(user.setor_id) !== filtroSetor) return false;

        const termo = filtro.toLowerCase();
        return (
            user.setor_nome?.toLowerCase().includes(termo) ||
            user.nome_completo?.toLowerCase().includes(termo) ||
            user.cpf?.toLowerCase().includes(termo) ||
            user.crm?.toLowerCase().includes(termo) ||
            user.cargo?.toLowerCase().includes(termo) ||
            user.email?.toLowerCase().includes(termo) ||
            user.situacao?.toLowerCase().includes(termo) ||
            user.horaEscala?.toLowerCase().includes(termo)
        );
    });

    if (loading)
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p className="mt-2">Carregando funcionários...</p>
            </Container>
        );

    if (erro)
        return (
            <Container className="mt-5">
                <Alert variant="danger" className="text-center">
                    {erro}
                </Alert>
            </Container>
        );

    return (
        <Container className="mt-4 pessoas-page">
            <Row className="mb-4">
                <Col md={5}>
                    <h2>Funcionários Cadastrados</h2>
                </Col>
                <Col md={3}>
                    <Form.Select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)}>
                        <option value="todos">Todos os setores</option>
                        {setores.map((s) => (
                            <option key={s.id} value={String(s.id)}>{s.nome}</option>
                        ))}
                        <option value="sem">Sem setor (coordenadores e admins)</option>
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Nome, CPF, Cargo..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </Col>
            </Row>

            <Table striped bordered hover responsive>
                <thead className="table-dark">
                    <tr>
                        <th>Nome</th>
                        <th>Cargo</th>
                        <th>Setor</th>
                        <th>Escala</th>
                        <th>Turno</th>
                        <th>Início do ciclo</th>
                        <th>Email</th>
                        <th>CRM/COREN</th>
                        <th>CPF</th>
                        <th>Status</th>
                        <th>Editar</th>
                        <th>Turnos</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados.map((pessoa) => {
                        const gestao = isCargoGestao(pessoa.cargo);
                        const editavel = podeEditar(pessoa);
                        // funcionário sem turno ou início do ciclo fica de fora da escala gerada do período
                        const classeNaoDefinido = gestao ? "text-muted" : "text-danger";

                        return (
                            <tr key={pessoa.id}>
                                <td>{pessoa.nome_completo}</td>
                                <td>{pessoa.cargo}</td>
                                <td>{pessoa.setor_nome || "—"}</td>
                                <td>{pessoa.horaEscala}</td>
                                <td className={pessoa.turno ? undefined : classeNaoDefinido}>
                                    {formatarTurno(pessoa.turno)}
                                </td>
                                <td className={pessoa.inicio_ciclo ? undefined : classeNaoDefinido}>
                                    {formatarInicioCiclo(pessoa.inicio_ciclo)}
                                </td>
                                <td>{pessoa.email || "—"}</td>
                                <td>{pessoa.crm || "—"}</td>
                                <td>{pessoa.cpf || "—"}</td>
                                <td>
                                    {/* ninguém desativa a própria conta */}
                                    {editavel && pessoa.id !== user?.id ? (
                                        <Button
                                            size="sm"
                                            variant={pessoa.situacao === "Ativo" ? "success" : "danger"}
                                            onClick={() => alternarStatusUsuario(pessoa)}
                                        >
                                            {pessoa.situacao}
                                        </Button>
                                    ) : (
                                        <Badge bg={pessoa.situacao === "Ativo" ? "success" : "danger"}>
                                            {pessoa.situacao}
                                        </Badge>
                                    )}
                                </td>
                                <td>
                                    {editavel && pessoa.situacao === "Ativo" && (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => abrirModalpessoa(pessoa)}
                                        >
                                            Editar
                                        </Button>
                                    )}
                                </td>
                                <td>
                                    {/* gestores não têm setor, então não recebem plantões */}
                                    {!gestao && pessoa.situacao === "Ativo" && (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={() => abrirModalTurnos(pessoa)}
                                        >
                                            Adicionar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            {pessoaSelecionada && (
                <EditarPessoa
                    show={showModalpessoa}
                    onClose={() => setShowModalPessoa(false)}
                    pessoa={pessoaSelecionada}
                    onSave={handleSave}
                    setores={setores}
                />
            )}

            {pessoaSelecionada && (
                <AdicionarTurno
                    show={showModalTurnos}
                    onClose={() => setShowModalTurnos(false)}
                    pessoa={pessoaSelecionada}
                    onSave={handleSave}
                />
            )}
        </Container>
    );
};

export default Pessoas;
