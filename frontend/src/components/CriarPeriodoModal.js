import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { api } from "./api/Api";

const estadoInicial = {
    data_inicio: "",
    data_fim: "",
};

const CriarPeriodoModal = ({ show, onClose }) => {
    const [formData, setFormData] = useState(estadoInicial);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setFormData(estadoInicial);
            setError("");
            setSuccess("");
        }
    }, [show]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.data_inicio || !formData.data_fim) {
            setError("Informe a data inicial e a data final.");
            return;
        }

        if (formData.data_inicio > formData.data_fim) {
            setError("A data inicial não pode ser posterior à data final.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await api.post("/periodos/", formData);
            setSuccess("Período criado com sucesso.");

            window.setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message || "Não foi possível criar o período.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Criar período</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="periodo-data-inicio">
                        <Form.Label>Data inicial</Form.Label>
                        <Form.Control
                            type="date"
                            name="data_inicio"
                            value={formData.data_inicio}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="periodo-data-fim">
                        <Form.Label>Data final</Form.Label>
                        <Form.Control
                            type="date"
                            name="data_fim"
                            value={formData.data_fim}
                            min={formData.data_inicio || undefined}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <div className="criar-periodo-actions">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Criar período"}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CriarPeriodoModal;