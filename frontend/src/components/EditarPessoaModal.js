import { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { api } from "./api/Api";
import { CARGO_ADMIN, CARGO_COORDENADOR, isAdmin, isCargoGestao } from "./utils/perfis";

export const OPCOES_TURNO = [
    { valor: "07:00 - 19:00", rotulo: "Diurno 07:00 - 19:00" },
    { valor: "19:00 - 07:00", rotulo: "Noturno 19:00 - 07:00" },
];

// só o admin cadastra ou altera coordenadores e admins
export const opcoesDeCargo = (usuarioLogado) => [
    { valor: "Tecnico", rotulo: "Técnico(a) de Enfermagem" },
    { valor: "Enfermeiro", rotulo: "Enfermeiro(a)" },
    ...(isAdmin(usuarioLogado)
        ? [
            { valor: CARGO_COORDENADOR, rotulo: "Coordenador" },
            { valor: CARGO_ADMIN, rotulo: "Admin" },
        ]
        : []),
];

export const usuarioDaSessao = () => {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
};

const EditarPessoaModal = ({ show, onClose, pessoa, onSave, setores = [] }) => {
    const [usuarioLogado] = useState(usuarioDaSessao);
    const [formData, setFormData] = useState({
        nome_completo: "",
        email: "",
        password: "",
        crm: "",
        cpf: "",
        cargo: "",
        horaEscala: "",
        situacao: "",
        setor_id: "",
        turno: "",
        inicio_ciclo: "",
    });
    const [error, setError] = useState("");

    useEffect(() => {
        if (pessoa) {
            setFormData({
                nome_completo: pessoa.nome_completo || "",
                email: pessoa.email || "",
                password: pessoa.password || "",
                crm: pessoa.crm || "",
                cpf: pessoa.cpf || "",
                cargo: pessoa.cargo || "",
                horaEscala: pessoa.horaEscala || "",
                situacao: pessoa.situacao,
                setor_id: pessoa.setor_id ? String(pessoa.setor_id) : "",
                turno: pessoa.turno || "",
                inicio_ciclo: pessoa.inicio_ciclo || "",
            });
            setError("");
        }
    }, [pessoa]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "cpf") {
            let val = value.replace(/\D/g, "");
            val = val.replace(/(\d{3})(\d)/, "$1.$2");
            val = val.replace(/(\d{3})(\d)/, "$1.$2");
            val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            setFormData((prev) => ({ ...prev, [name]: val }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateCrm = (crm) => {
        const value = crm.trim().toUpperCase();
        const regex = /^[0-9]{3,6}-[A-Z]{2}\/(ENF|TE|AE|OBST)$/;
        if (!regex.test(value)) {
            return {
                valido: false,
                mensagem: "Formato do COREN inválido! Use o padrão: XXXXXX-YY/ZZZ"
            };
        }
        return { valido: true };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { nome_completo, email, crm, cpf, cargo, horaEscala } = formData;
        const gestao = isCargoGestao(cargo);
        if (!nome_completo || !email || (!crm && !gestao) || !cpf || !cargo || !horaEscala || (!gestao && !formData.setor_id)) {
            setError("Preencha todos os campos obrigatórios!");
            return;
        }

        const crmValid = crm ? validateCrm(crm) : { valido: true };
        if (!crmValid.valido) {
            setError(crmValid.mensagem);
            return;
        }

        setError("");

        try {
            const data = await api.put(`/users/${pessoa.id}`, {
                ...formData,
                crm: crm || null,
                setor_id: gestao ? null : Number(formData.setor_id),
                turno: gestao ? null : formData.turno || null,
                inicio_ciclo: gestao ? null : formData.inicio_ciclo || null,
            });
            onSave(data);
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "Erro de conexão com o servidor");
        }
    };

    const cargoDeGestao = isCargoGestao(formData.cargo);
    const editandoASiMesmo = Boolean(pessoa && usuarioLogado && pessoa.id === usuarioLogado.id);
    const opcoesCargo = opcoesDeCargo(usuarioLogado);
    // mantém o cargo atual visível mesmo quando o usuário logado não pode escolhê-lo
    if (formData.cargo && !opcoesCargo.some((c) => c.valor === formData.cargo)) {
        opcoesCargo.push({ valor: formData.cargo, rotulo: formData.cargo });
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Editar Funcionário</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome Completo</Form.Label>
                        <Form.Control
                            type="text"
                            name="nome_completo"
                            value={formData.nome_completo}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Senha</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>CRM{cargoDeGestao && " (opcional)"}</Form.Label>
                        <Form.Control
                            type="text"
                            name="crm"
                            value={formData.crm}
                            placeholder="Ex: 123456-RJ/ENF"
                            onChange={handleChange}
                            required={!cargoDeGestao}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>CPF</Form.Label>
                        <Form.Control
                            type="text"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            maxLength={14}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Cargo</Form.Label>
                        <Form.Select
                            name="cargo"
                            value={formData.cargo}
                            onChange={handleChange}
                            disabled={editandoASiMesmo}
                            required
                        >
                            <option value="">Selecione o cargo</option>
                            {opcoesCargo.map((c) => (
                                <option key={c.valor} value={c.valor}>{c.rotulo}</option>
                            ))}
                        </Form.Select>
                        {editandoASiMesmo && (
                            <Form.Text muted>Você não pode alterar o seu próprio cargo.</Form.Text>
                        )}
                    </Form.Group>
                    {!cargoDeGestao && (
                        <Form.Group className="mb-3">
                            <Form.Label>Setor</Form.Label>
                            <Form.Select
                                name="setor_id"
                                value={formData.setor_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o setor</option>
                                {setores.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Hora de Escala</Form.Label>
                        <Form.Select
                            name="horaEscala"
                            value={formData.horaEscala}
                            onChange={handleChange}
                            required
                        >
                            <option value="12x36">12x36</option>
                            <option value="12x60">12x60</option>
                        </Form.Select>
                    </Form.Group>
                    {!cargoDeGestao && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Turno</Form.Label>
                                <Form.Select
                                    name="turno"
                                    value={formData.turno}
                                    onChange={handleChange}
                                >
                                    <option value="">Não definido</option>
                                    {OPCOES_TURNO.map((t) => (
                                        <option key={t.valor} value={t.valor}>{t.rotulo}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Início do ciclo</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="inicio_ciclo"
                                    value={formData.inicio_ciclo}
                                    onChange={handleChange}
                                />
                                <Form.Text muted>
                                    Primeiro dia de trabalho. A escala do período segue o regime a partir dele.
                                </Form.Text>
                            </Form.Group>

                            {(!formData.turno || !formData.inicio_ciclo) && (
                                <Alert variant="warning">
                                    Sem turno e início do ciclo o funcionário não entra na escala gerada do período.
                                </Alert>
                            )}
                        </>
                    )}

                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onClose} className="me-2">
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            Salvar
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditarPessoaModal;
