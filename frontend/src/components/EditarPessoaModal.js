import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const EditarPessoaModal = ({ show, onClose, pessoa, onSave }) => {
    const [formData, setFormData] = useState({
        nome_completo: "",
        email: "",
        password: "",
        crm: "",
        cpf: "",
        cargo: "",
        horaEscala: "",
        situacao: "",
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

        const { nome_completo, email, password, crm, cpf, cargo, horaEscala, situacao } = formData;
        if (!nome_completo || !email || !password || !crm || !cpf || !cargo || !horaEscala) {
            setError("Preencha todos os campos obrigatórios!");
            return;
        }

        const crmValid = validateCrm(crm);
        if (!crmValid.valido) {
            setError(crmValid.mensagem);
            return;
        }

        setError("");

        try {
            const res = await fetch(`http://localhost:8000/usuario/${pessoa.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (Array.isArray(errorData.detail)) {
                    const messages = errorData.detail.map(err => err.msg).join(", ");
                    setError(messages);
                } else {
                    setError(errorData.detail || "Erro ao atualizar usuário");
                }
                return;
            }

            const data = await res.json();
            onSave(data);
            onClose();

        } catch (err) {
            console.error(err);
            setError("Erro de conexão com o servidor");
        }
    };

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
                            type="text"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>CRM</Form.Label>
                        <Form.Control
                            type="text"
                            name="crm"
                            value={formData.crm}
                            placeholder="Ex: 123456-RJ/ENF"
                            onChange={handleChange}
                            required
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
                            required
                        >
                            <option value="">Selecione o cargo</option>
                            <option value="Tecnico">Técnico(a) de Enfermagem</option>
                            <option value="Enfermeiro">Enfermeiro(a)</option>
                            <option value="Coordenador">Coordenador</option>
                        </Form.Select>
                    </Form.Group>
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
