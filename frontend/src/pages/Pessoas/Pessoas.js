import { useState, useEffect } from "react";
import EditarPessoa from "../../components/EditarPessoaModal";
import AdicionarTurno from "../../components/AdicionarTurnoModal";
import { Spinner, Alert, Table, Button, Container, Row, Col, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Pessoas.css";

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

const getEscalasFuturasDoUsuario = async (nomeCompleto, Cpf, diasBusca = 90) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const datasComEscala = [];

    for (let i = 1; i <= diasBusca; i++) {
        const data = addDays(hoje, i);
        const dataBR = formatDateBR(data);

        try {
            const res = await fetch(`http://localhost:8000/escaladodia/${dataBR}`);
            if (!res.ok) continue;

            const dataRes = await res.json();
            const escala = dataRes?.Escala || [];

            const estaEscalado = escala.some((e) => e.Nome === nomeCompleto && e.Cpf === Cpf);

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

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (parsedUser.cargo.toLowerCase() !== "coordenador") {
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
            if (!user || user.cargo.toLowerCase() !== "coordenador") return;

            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8000/usuario/", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error();
                const data = await res.json();
                setUsuarios(data);
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
            90
        );
        if (datasEscaladas.length == 0 && 
            !window.confirm(
                `Deseja realmente alterar o status de ${usuario.nome_completo} para ${novoStatus}?`
            )
        )
            return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:8000/usuario/${usuario.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...usuario,
                    situacao: novoStatus,
                }),
            });

            if (!res.ok) {
                alert("Erro ao atualizar status");
                return;
            }

            setUsuarios((prev) =>
                prev.map((u) =>
                    u.id === usuario.id ? { ...u, situacao: novoStatus } : u
                )
            );
        } catch {
            alert("Erro de conexão com o servidor");
        }
    };

    
    const usuariosFiltrados = usuarios.filter((user) => {
        const termo = filtro.toLowerCase();
        return (
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
                <Col md={6}>
                    <h2>Funcionários Cadastrados</h2>
                </Col>
                <Col md={6}>
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
                        <th>Escala</th>
                        <th>Email</th>
                        <th>CRM/COREN</th>
                        <th>CPF</th>
                        <th>Status</th>
                        <th>Editar</th>
                        <th>Turnos</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados.map((user) => (
                        <tr key={user.id}>
                            <td>{user.nome_completo}</td>
                            <td>{user.cargo}</td>
                            <td>{user.horaEscala}</td>
                            <td>{user.email || "—"}</td>
                            <td>{user.crm || "—"}</td>
                            <td>{user.cpf || "—"}</td>
                            <td>
                                <Button
                                    size="sm"
                                    variant={user.situacao === "Ativo" ? "success" : "danger"}
                                    onClick={() => alternarStatusUsuario(user)}
                                >
                                    {user.situacao}
                                </Button>
                            </td>
                            <td>
                                {user.situacao === "Ativo" && (
                                    <Button
                                        size="sm"
                                        variant="warning"
                                        onClick={() => abrirModalpessoa(user)}
                                    >
                                        Editar
                                    </Button>
                                )}
                            </td>
                            <td>
                                {user.situacao === "Ativo" && (
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => abrirModalTurnos(user)}
                                    >
                                        Adicionar
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {pessoaSelecionada && (
                <EditarPessoa
                    show={showModalpessoa}
                    onClose={() => setShowModalPessoa(false)}
                    pessoa={pessoaSelecionada}
                    onSave={handleSave}
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
