import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { api } from "./api/Api";
import { calcularDataFim, diasSemPeriodo, formatarData, hojeISO } from "./utils/periodos";
import { confirmar } from "./Mensagens";
import CampoData from "./CampoData";

const descreverTrecho = ({ inicio, fim }) =>
    inicio === fim ? `o dia ${formatarData(inicio)}` : `os dias de ${formatarData(inicio)} a ${formatarData(fim)}`;

const CriarPeriodoModal = ({ show, onClose, onCreated, sugestaoInicio, periodos = [] }) => {
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

        const trechos = diasSemPeriodo(periodos, dataInicio, dataFim);
        if (trechos.length > 0) {
            const lista = trechos.map(descreverTrecho).join(" e ");
            const continuar = await confirmar(
                `Com este período, ${lista} não ficarão cobertos por nenhum período.\n\n` +
                "Tem certeza de que deseja criar este período?",
                { titulo: "Dias sem período", variante: "atencao", textoOk: "Sim, criar", textoCancelar: "Cancelar" }
            );
            if (!continuar) return;
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
                        <CampoData
                            id="periodo-data-inicio"
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
