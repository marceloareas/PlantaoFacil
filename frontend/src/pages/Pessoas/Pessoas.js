import { useState, useEffect } from "react";
import EditarPessoa from "../../components/EditarPessoaModal";
import { Spinner, Alert, Table, Button, Container, Row, Col, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Pessoas.css";

const Pessoas = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [showModal, setShowModal] = useState(false);
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
                return;
            }
        } else {
            setErro("Usuário não autenticado. Faça login novamente.");
            setLoading(false);
            return;
        }
    }, []);

   useEffect(() => {
        const fetchUsuarios = async () => {
            if (!user || user.cargo.toLowerCase() !== "coordenador") return;

            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8000/usuario/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Erro ao buscar funcionários");
                const data = await res.json();
                setUsuarios(data);
            } catch (err) {
                console.error(err);
                setErro("Não foi possível carregar os funcionários.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, [user]);

    const abrirModal = (pessoa) => {
        setPessoaSelecionada(pessoa);
        setShowModal(true);
    };

    const handleSave = (updatedPessoa) => {
        setUsuarios((prev) =>
            prev.map((u) => (u.id === updatedPessoa.user.id ? updatedPessoa.user : u))
        );
    };

    const alternarStatusUsuario = async (usuario) => {
        const novoStatus = usuario.situacao === "Ativo" ? "Desativado" : "Ativo";

        if (!window.confirm(`Deseja realmente alterar o status de ${usuario.nome_completo} para ${novoStatus}?`)) {
            return;
        }

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

        } catch (error) {
            console.error(error);
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
                <Spinner animation="border" variant="primary" />
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
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h2 className="text-center text-md-start mb-3 mb-md-0">
                        Funcionários Cadastrados
                    </h2>
                </Col>
                <Col md={6}>
                    <Form.Control
                        type="text"
                        placeholder="Nome, CPF, Coren, Cargo..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </Col>
            </Row>

            <Row>
                <Col>
                    <div className="table-responsive">
                        <Table striped bordered hover className="align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Nome Completo</th>
                                    <th>Cargo</th>
                                    <th>Escala</th>
                                    <th>Email</th>
                                    <th>CRM/COREN</th>
                                    <th>CPF</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.length > 0 ? (
                                    usuariosFiltrados.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.nome_completo}</td>
                                            <td>{user.cargo}</td>
                                            <td>{user.horaEscala}</td>
                                            <td>{user.email || "—"}</td>
                                            <td>{user.crm || "—"}</td>
                                            <td>{user.cpf || "—"}</td>

                                            <td>
                                                {user.situacao?.toLowerCase() === "ativo" ? (
                                                    <Button variant="success" size="sm" 
                                                        onClick={() => alternarStatusUsuario(user)}>
                                                        Ativo
                                                    </Button>
                                                ) : (
                                                    <Button variant="danger" size="sm"
                                                        onClick={() => alternarStatusUsuario(user)}>
                                                        Desativado
                                                    </Button>
                                                )}
                                            </td>

                                            <td>
                                                {user.situacao === "Ativo" && (
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => abrirModal(user)}
                                                    >
                                                        Editar
                                                    </Button>
                                                )}
                                                </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted">
                                            Nenhum funcionário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>

            {pessoaSelecionada && (
                <EditarPessoa
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    pessoa={pessoaSelecionada}
                    onSave={handleSave}
                />
            )}
        </Container>
    );
};

export default Pessoas;
