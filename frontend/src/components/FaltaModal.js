import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { api } from "./api/Api";

const hojeISO = () => {
    const hoje = new Date();
    const d = String(hoje.getDate()).padStart(2, "0");
    const m = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${hoje.getFullYear()}-${m}-${d}`;
};

const paraISO = (dataBR) => {
    const [d, m, a] = dataBR.split("-");
    return `${a}-${m}-${d}`;
};

// formata sem passar por Date, que interpretaria "AAAA-MM-DD" em UTC e mostraria o dia anterior
const formatarData = (valor) => {
    if (!valor) return "";
    const iso = valor.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.split("-").reverse().join("/");
    return valor.replaceAll("-", "/");
};

// "AAAA-MM-DDTHH:MM:SS..." para "DD/MM/AAAA às HH:MM"
const formatarDataHora = (valor) => {
    const partes = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(valor || "");
    if (!partes) return formatarData(valor);
    const [, ano, mes, dia, hora, minuto] = partes;
    return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
};

const FaltaModal = ({ show, onClose, funcionario, dataBR, horario, falta, troca, onAlterado }) => {
    const [observacao, setObservacao] = useState("");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (show) {
            setObservacao("");
            setErro("");
        }
    }, [show, funcionario, dataBR, horario]);

    if (!funcionario) return null;

    const dataFutura = dataBR ? paraISO(dataBR) > hojeISO() : false;

    const registrarFalta = async () => {
        setErro("");
        setSalvando(true);
        try {
            await api.post("/faltas/", {
                cpf: funcionario.cpf,
                data: dataBR,
                horario,
                observacao: observacao.trim() || null,
            });
            onAlterado?.();
        } catch (err) {
            setErro(err.message || "Não foi possível registrar a falta.");
        } finally {
            setSalvando(false);
        }
    };

    const removerFalta = async () => {
        if (!window.confirm(`Remover a falta de ${funcionario.nome} em ${formatarData(dataBR)}?`)) return;

        setErro("");
        setSalvando(true);
        try {
            await api.delete(`/faltas/${falta.id}`);
            onAlterado?.();
        } catch (err) {
            setErro(err.message || "Não foi possível remover a falta.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{funcionario.nome}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p className="mb-1"><strong>Data:</strong> {formatarData(dataBR)}</p>
                <p><strong>Turno:</strong> {horario}</p>

                {troca && (
                    <div className="border border-warning rounded p-2 mb-3">
                        <h6 style={{ color: "#d39e00" }}>Troca aprovada</h6>
                        <p className="mb-1"><strong>Solicitante:</strong> {troca.nomeSolicitante}</p>
                        <p className="mb-1"><strong>Data solicitante:</strong> {formatarData(troca.meudia)}</p>
                        <p className="mb-1"><strong>Turno solicitante:</strong> {troca.horariosolicitante}</p>
                        <p className="mb-1"><strong>Destinatário:</strong> {troca.nomeDestinatario}</p>
                        <p className="mb-1"><strong>Data destinatário:</strong> {formatarData(troca.diacolega)}</p>
                        <p className="mb-1"><strong>Turno destinatário:</strong> {troca.horariodestinatario}</p>
                        <p className="mb-0"><strong>Motivo:</strong> {troca.motivo}</p>
                    </div>
                )}

                {erro && <div className="alert alert-danger">{erro}</div>}

                {falta ? (
                    <div className="alert alert-warning mb-0">
                        <p className="mb-1"><strong>Falta registrada</strong></p>
                        <p className="mb-1">
                            Em {formatarDataHora(falta.registrado_em)}
                            {falta.registrado_por && ` por ${falta.registrado_por}`}
                        </p>
                        <p className="mb-0" style={{ wordBreak: "break-word" }}>
                            <strong>Observação:</strong>{" "}
                            {falta.observacao || <span className="text-muted">nenhuma</span>}
                        </p>
                    </div>
                ) : (
                    <>
                        <Form.Group controlId="falta-observacao">
                            <Form.Label>Observação (opcional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                maxLength={500}
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                disabled={dataFutura || salvando}
                            />
                        </Form.Group>
                        {dataFutura && (
                            <p className="text-muted small mt-2 mb-0">
                                Só é possível registrar falta de hoje ou de dias anteriores
                            </p>
                        )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={salvando}>
                    Fechar
                </Button>
                {falta ? (
                    <Button variant="outline-danger" onClick={removerFalta} disabled={salvando}>
                        {salvando ? "Removendo..." : "Remover falta"}
                    </Button>
                ) : (
                    <Button variant="danger" onClick={registrarFalta} disabled={dataFutura || salvando}>
                        {salvando ? "Registrando..." : "Registrar falta"}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default FaltaModal;
