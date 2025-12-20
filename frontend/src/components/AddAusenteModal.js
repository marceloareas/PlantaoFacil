import React, { useState, useEffect } from "react";
import { FaUserMinus } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const AddAusenteModal = ({ show, onClose, onSuccess }) => {

    const [formData, setFormData] = useState({
        nome: "",
        cpf: "",
        cargo: "",
        motivo: "",
        data: "",
        horario: "07:00 - 19:00",
        data_final: null,
        horario_final: null
    });

    const [tipoAusencia, setTipoAusencia] = useState("turno");
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

                const cargosUnicos = [...new Set(data.map(u => u.cargo))]
                    .filter((cargo) => cargo.toLowerCase() !== "coordenador");

                setCargos(cargosUnicos);
            } catch (err) {
                console.error(err);
                setError("Erro ao buscar usuários. Tente novamente.");
            }
        };

        fetchUsuarios();
    }, []);

    const funcionariosFiltrados = formData.cargo
        ? funcionarios.filter((f) => f.cargo === formData.cargo)
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
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nome || !formData.cpf || !formData.cargo || !formData.motivo) {
            setError("Preencha todos os campos obrigatórios!");
            return;
        }

        if (!formData.data) {
            setError("Informe a data.");
            return;
        }
        if (tipoAusencia === "intervalo" && !formData.data_final) {
            setError("Informe a data final.");
            return;
        }

        setError("");
        setSuccess("");

        let payload = {
            ausente: "Sim",
            nome: formData.nome,
            cpf: formData.cpf,
            cargo: formData.cargo,
            motivo: formData.motivo,
            data: formData.data,
            horario: formData.horario,
            data_final: null,
            horario_final: null
        }

        if (tipoAusencia === "intervalo") {
            payload.data_final = formData.data_final;
            payload.horario_final = formData.horario_final;
        }
        const conflitos = await verificarConflitosEscala();

        try {
            const res = await fetch("http://localhost:8000/ausentes/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.detail || "Erro ao registrar ausente");
                return;
            }

            setSuccess("Funcionário ausente registrado com sucesso!");

            if (conflitos.length > 0) {
                const lista = conflitos
                    .map(c => `${c.data} - ${c.horario}`)
                    .join("\n");

                alert(
                    `⚠️ O funcionário ${formData.nome} já está escalado no(s) seguinte(s) dia(s):\n\n${lista}`
                );
            }

            setFormData({
                nome: "",
                cpf: "",
                cargo: "",
                motivo: "",
                data: "",
                horario: "07:00 - 19:00",
                data_final: null,
                horario_final: null
            });

            setTipoAusencia("turno");

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

    const verificarConflitosEscala = async () => {
        const conflitos = [];

        const adicionarConflito = (data, horario) => {
            conflitos.push({
                data,
                horario
            });
        };

        const formatarDataBR = (data) => {
            const [y, m, d] = data.split("-");
            return `${d}-${m}-${y}`;
        };

        if (tipoAusencia === "turno") {
            const res = await fetch(`http://localhost:8000/escaladodia/${formatarDataBR(formData.data)}`);
            if (res.ok) {
                const data = await res.json();
                data.Escala?.forEach(e => {
                    if (e.Nome === formData.nome && e.Horario === formData.horario) {
                        adicionarConflito(formatarDataBR(formData.data), e.Horario);
                    }
                });
            }
        }
        if (tipoAusencia === "intervalo") {
            const TURNOS = ["07:00 - 19:00", "19:00 - 07:00"];

            const formatarDataURL = (dataISO) => {
                const [y, m, d] = dataISO.split("-");
                return `${d}-${m}-${y}`;
            };

            let atual = new Date(formData.data);
            const fim = new Date(formData.data_final);

            while (atual <= fim) {
                const dataISO = atual.toISOString().split("T")[0];
                const dataURL = formatarDataURL(dataISO);

                let turnosParaVerificar = [];

                if (formData.data === formData.data_final) {
                    turnosParaVerificar = TURNOS.filter(
                        t => t === formData.horario || t === formData.horario_final
                    );
                }

                else if (dataISO === formData.data) {
                    turnosParaVerificar = TURNOS.filter(
                        t => t === formData.horario
                    );
                }

                else if (dataISO === formData.data_final) {
                    turnosParaVerificar = TURNOS.filter(
                        t => t === formData.horario_final
                    );
                }

                else {
                    turnosParaVerificar = TURNOS;
                }

                const res = await fetch(`http://localhost:8000/escaladodia/${dataURL}`);
                if (res.ok) {
                    const data = await res.json();

                    for (const turno of turnosParaVerificar) {
                        const existeEscala = data.Escala?.some(
                            e => e.Nome === formData.nome && e.Horario === turno
                        );

                        if (existeEscala) {
                            adicionarConflito(formatarDataBR(dataISO), turno);
                        }
                    }
                }

                atual.setDate(atual.getDate() + 1);
            }
        }


        return conflitos;
    };


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
                                        disabled={!formData.cargo}
                                    >
                                        <option value="">Selecione o funcionário</option>
                                        {funcionariosFiltrados.map((f, idx) => (
                                            <option key={idx} value={f.nome_completo}>
                                                {f.nome_completo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">CPF</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.cpf}
                                        readOnly
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Tipo de ausência</label>
                                    <div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="tipoAusencia"
                                                value="turno"
                                                checked={tipoAusencia === "turno"}
                                                onChange={(e) => setTipoAusencia(e.target.value)}
                                            />
                                            <label className="form-check-label">Um turno</label>
                                        </div>

                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="tipoAusencia"
                                                value="intervalo"
                                                checked={tipoAusencia === "intervalo"}
                                                onChange={(e) => setTipoAusencia(e.target.value)}
                                            />
                                            <label className="form-check-label">Um Período</label>
                                        </div>
                                    </div>
                                </div>

                                {tipoAusencia === "turno" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Data</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="data"
                                                value={formData.data}
                                                onChange={handleChange}
                                            />

                                            <label className="form-label mt-2">Turno</label>
                                            <select
                                                className="form-select"
                                                name="horario"
                                                value={formData.horario}
                                                onChange={handleChange}
                                            >
                                                <option value="07:00 - 19:00">07:00 - 19:00</option>
                                                <option value="19:00 - 07:00">19:00 - 07:00</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {tipoAusencia === "intervalo" && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Data Inicial</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="data"
                                                value={formData.data}
                                                onChange={handleChange}
                                            />

                                            <label className="form-label mt-2">Turno Inicial</label>
                                            <select
                                                className="form-select"
                                                name="horario"
                                                value={formData.horario}
                                                onChange={handleChange}
                                            >
                                                <option value="07:00 - 19:00">07:00 - 19:00</option>
                                                <option value="19:00 - 07:00">19:00 - 07:00</option>
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Data Final</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="data_final"
                                                value={formData.data_final}
                                                onChange={handleChange}
                                            />

                                            <label className="form-label mt-2">Turno Final</label>
                                            <select
                                                className="form-select"
                                                name="horario_final"
                                                value={formData.horario_final}
                                                onChange={handleChange}
                                            >
                                                <option value="07:00 - 19:00">07:00 - 19:00</option>
                                                <option value="19:00 - 07:00">19:00 - 07:00</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Motivo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="motivo"
                                        value={formData.motivo}
                                        onChange={handleChange}
                                    />
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
