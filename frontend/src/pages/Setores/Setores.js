import { useEffect, useState } from "react";
import { Container, Table, Button, Form, Alert, Spinner, Row, Col, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { api } from "../../components/api/Api";

const Setores = ({ user, setorAtual, onSetorAtualChange }) => {
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [novoSetor, setNovoSetor] = useState("");

    const carregarSetores = async () => {
        try {
            setSetores(await api.get("/setores/"));
        } catch (err) {
            setErro(err.message || "Erro ao carregar setores.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarSetores();
    }, []);

    if (user?.cargo !== "Coordenador") {
        return <h2>Você não tem permissão para acessar esta página.</h2>;
    }

    const criarSetor = async (e) => {
        e.preventDefault();
        if (!novoSetor.trim()) return;

        try {
            await api.post("/setores/", { nome: novoSetor.trim() });
            setNovoSetor("");
            setErro("");
            carregarSetores();
        } catch (err) {
            setErro(err.message || "Erro ao criar setor.");
        }
    };

    const renomearSetor = async (setor) => {
        const nome = window.prompt("Novo nome do setor:", setor.nome);
        if (!nome || nome.trim() === setor.nome) return;

        try {
            const atualizado = await api.put(`/setores/${setor.id}`, { nome: nome.trim() });
            if (setor.id === setorAtual?.id) onSetorAtualChange(atualizado);
            setErro("");
            carregarSetores();
        } catch (err) {
            setErro(err.message || "Erro ao renomear setor.");
        }
    };

    const excluirSetor = async (setor) => {
        if (!window.confirm(`Deseja realmente excluir o setor ${setor.nome}?`)) return;

        try {
            await api.delete(`/setores/${setor.id}`);
            if (setor.id === setorAtual?.id) {
                onSetorAtualChange(null);
                return;
            }
            setErro("");
            carregarSetores();
        } catch (err) {
            setErro(err.message || "Erro ao excluir setor.");
        }
    };

    return (
        <Container className="mt-4" style={{ minWidth: "min(760px, 95vw)" }}>
            <Row className="mb-4">
                <Col md={6}>
                    <h2>Setores</h2>
                </Col>
                <Col md={6}>
                    <Form onSubmit={criarSetor} className="d-flex gap-2">
                        <Form.Control
                            placeholder="Nome do novo setor"
                            value={novoSetor}
                            onChange={(e) => setNovoSetor(e.target.value)}
                        />
                        <Button type="submit" variant="success">Criar</Button>
                    </Form>
                </Col>
            </Row>

            {erro && <Alert variant="danger">{erro}</Alert>}

            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                <Table striped bordered hover responsive>
                    <thead className="table-dark">
                        <tr>
                            <th>Setor</th>
                            <th>Funcionários</th>
                            <th style={{ width: "1%", whiteSpace: "nowrap" }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {setores.map((setor) => (
                            <tr key={setor.id}>
                                <td>
                                    {setor.nome}
                                    {setor.id === setorAtual?.id && <Badge bg="primary" className="ms-2">Coordenando</Badge>}
                                </td>
                                <td>{setor.total_funcionarios}</td>
                                <td>
                                    <div className="d-flex gap-2">
                                        {setor.id !== setorAtual?.id && (
                                            <Button size="sm" variant="primary" onClick={() => onSetorAtualChange(setor)}>
                                                Coordenar
                                            </Button>
                                        )}
                                        <Button size="sm" variant="warning" onClick={() => renomearSetor(setor)}>
                                            Renomear
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => excluirSetor(setor)}>
                                            Excluir
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default Setores;
