import { useEffect, useState } from "react";
import { Modal, Button, Form, ListGroup, Alert, Spinner } from "react-bootstrap";
import { api } from "./api/Api";

const SetorSelectorModal = ({ show, setorAtual, onSelect, onClose }) => {
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [novoSetor, setNovoSetor] = useState("");
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (!show) return;

        setErro("");
        setLoading(true);
        api.get("/setores/")
            .then(setSetores)
            .catch((err) => setErro(err.message || "Erro ao carregar setores."))
            .finally(() => setLoading(false));
    }, [show]);

    const criarSetor = async (e) => {
        e.preventDefault();
        if (!novoSetor.trim()) return;

        try {
            const setor = await api.post("/setores/", { nome: novoSetor.trim() });
            setSetores((prev) => [...prev, setor].sort((a, b) => a.nome.localeCompare(b.nome)));
            setNovoSetor("");
            setErro("");
        } catch (err) {
            setErro(err.message || "Erro ao criar setor.");
        }
    };

    // sem setor escolhido o coordenador não pode fechar o modal
    const podeFechar = Boolean(setorAtual);

    return (
        <Modal
            show={show}
            onHide={podeFechar ? onClose : () => {}}
            backdrop={podeFechar ? true : "static"}
            keyboard={podeFechar}
            centered
        >
            <Modal.Header closeButton={podeFechar}>
                <Modal.Title>Qual setor você está coordenando?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {erro && <Alert variant="danger">{erro}</Alert>}

                {loading ? (
                    <div className="text-center my-3"><Spinner animation="border" /></div>
                ) : setores.length === 0 ? (
                    <p className="text-muted">Nenhum setor cadastrado. Crie o primeiro abaixo.</p>
                ) : (
                    <ListGroup className="mb-3">
                        {setores.map((s) => (
                            <ListGroup.Item
                                key={s.id}
                                action
                                active={s.id === setorAtual?.id}
                                onClick={() => onSelect(s)}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <span>{s.nome}</span>
                                <small>{s.total_funcionarios} funcionário(s)</small>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}

                <Form onSubmit={criarSetor} className="d-flex gap-2">
                    <Form.Control
                        placeholder="Novo setor (ex: UTI, Emergência)"
                        value={novoSetor}
                        onChange={(e) => setNovoSetor(e.target.value)}
                    />
                    <Button type="submit" variant="outline-primary">Criar</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default SetorSelectorModal;
