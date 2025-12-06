import React, { useState, useEffect } from "react";
import { FaUserMinus } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const AddAusenteModal = ({ show, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        ausente: "Sim",
        nome: "",
        cpf: "",
        data: "",
        horario: "07:00 - 19:00",
        cargo: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [cargos, setCargos] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const res = await fetch("http://localhost:8000/usuario/");
                const data = await res.json();
                setFuncionarios(data);
                const cargosUnicos = [...new Set(data.map(u => u.cargo)
                )].filter((cargo) => cargo.toLowerCase() !== "coordenador");
                setCargos(cargosUnicos);
            } catch (err) {
                console.error(err);
                setError("Erro ao buscar usuários. Tente novamente.");
            }
        };
        fetchUsuarios();
    }, []);

    const funcionariosFiltrados = formData.cargo
        ? funcionarios.filter(f => f.cargo === formData.cargo)
        : [];

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "nome") {
            const funcionario = funcionariosFiltrados.find(f => f.nome_completo === value);
            setFormData({
                ...formData,
                nome: value,
                cpf: funcionario ? funcionario.cpf : "",
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nome || !formData.cpf || !formData.data || !formData.cargo) {
            setError("Preencha todos os campos obrigatórios!");
            return;
        }

        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://localhost:8000/ausentes/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();

                if (data.detail) {
                    const detailMsg = typeof data.detail === "string"
                        ? data.detail
                        : JSON.stringify(data.detail);
                    setError(detailMsg);
                } else {
                    setError("Erro ao cadastrar ausente");
                }
                return;
            }

            setSuccess("Funcionário ausente registrado com sucesso!");
            setFormData({
                ausente: "Sim",
                nome: "",
                cpf: "",
                data: "",
                horario: "07:00 - 19:00",
                cargo: "",
            });

            if (onSuccess) onSuccess();

            setTimeout(() => {
                setSuccess("");
                onClose();
            }, 1000);

        } catch (err) {
            console.error(err);
            setError("Erro de conexão. Tente novamente.");
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title d-flex align-items-center">
                                <FaUserMinus className="text-primary me-2" />
                                Registrar Funcionário Ausente
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <form onSubmit={handleSubmit}>

                                <div className="mb-3">
                                    <label className="form-label">Cargo</label>
                                    <select
                                        className="form-select"
                                        name="cargo"
                                        value={formData.cargo}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione o cargo</option>
                                        {cargos.map((c, idx) => (
                                            <option key={idx} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Nome</label>
                                    <select
                                        className="form-select"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.cargo}
                                    >
                                        <option value="">Selecione o funcionário</option>
                                        {funcionariosFiltrados.map((f, idx) => (
                                            <option key={idx} value={f.nome_completo}>{f.nome_completo}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">CPF</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="cpf"
                                        value={formData.cpf}
                                        readOnly
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Data</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="data"
                                        value={formData.data}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Horário</label>
                                    <select
                                        className="form-select"
                                        name="horario"
                                        value={"07:00 - 19:00"}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="07:00 - 19:00">07:00 - 19:00</option>
                                        <option value="19:00 - 07:00">19:00 - 07:00</option>
                                    </select>
                                </div>

                                <button type="submit" className="btn btn-primary w-100">
                                    Registrar Ausente
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default AddAusenteModal;
