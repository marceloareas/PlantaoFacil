import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { api } from "./api/Api";
import { calcularDataFim, formatarData, hojeISO } from "./utils/periodos";

const CriarPeriodoModal = ({ show, onClose, onCreated, sugestaoInicio }) => {
    const [dataInicio, setDataInicio] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setDataInicio(sugestaoInicio || hojeISO());
            setError("");
        }
    }, [show, sugestaoInicio]);

    const dataFim = calcularDataFim(dataInicio);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!dataInicio) {
            setError("Informe a data de início do período.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const periodo = await api.post("/periodos/", { data_inicio: dataInicio });
            if (onCreated) onCreated(periodo);
            onClose();
        } catch (err) {
            setError(err.message || "Não foi possível criar o período.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Novo período</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="periodo-data-inicio">
                        <Form.Label>Data de início</Form.Label>
                        <Form.Control
                            type="date"
                            value={dataInicio}
                            onChange={(e) => {
                                setDataInicio(e.target.value);
                                setError("");
                            }}
                            required
                        />
                        <Form.Text muted>
                            O período termina sempre no dia anterior ao mesmo dia do mês seguinte.
                        </Form.Text>
                    </Form.Group>

                    {dataFim && (
                        <p>
                            O período vai de <strong>{formatarData(dataInicio)}</strong> até{" "}
                            <strong>{formatarData(dataFim)}</strong>.
                        </p>
                    )}

                    <div className="d-flex justify-content-end gap-2">
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
