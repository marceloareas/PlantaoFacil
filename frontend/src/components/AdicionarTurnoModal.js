import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const AdicionarTurnoModal = ({ show, onClose, pessoa }) => {

   
    const tomorrow = new Date();        // como padrao a data sera sempre amanha...
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [formData, setFormData] = useState({
        data_inicio: tomorrow.toISOString().split("T")[0],
        horario: "07:00 - 19:00",
        quantidade_dias: 1
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.data_inicio || formData.quantidade_dias <= 0) {
            setError("Preencha todos os campos corretamente.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/escalaLote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario_id: pessoa.id,
                    horario: formData.horario,
                    data_inicio: formData.data_inicio,
                    quantidade_dias: Number(formData.quantidade_dias)
                })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.detail || "Erro ao criar escala.");
                return;
            }

            setSuccess("Turnos alocados com sucesso!");

            setTimeout(() => {
                setSuccess("");
                onClose();
            }, 1200);

        } catch (err) {
            console.error(err);
            setError("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">
                                Adicionar Turnos
                            </h5>
                            <button className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">

                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <div className="mb-3">  {/* Informações básicas da pessoa que esta recebendo os turnos*/}
                                <p><strong>Nome:</strong> {pessoa.nome_completo}</p>
                                <p><strong>Cargo:</strong> {pessoa.cargo}</p>
                                <p><strong>Jornada:</strong> {pessoa.horaEscala}</p>
                            </div>

                            <form onSubmit={handleSubmit}>

                                <div className="mb-3">
                                    <label className="form-label">Data Inicial</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="data_inicio"
                                        value={formData.data_inicio}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Turno</label>
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
                                    <label className="form-label">Quantidade de dias</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="quantidade_dias"
                                        value={formData.quantidade_dias}
                                        onChange={handleChange}
                                        min={1}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-success w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Gerando..." : "Gerar Turnos"}
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

export default AdicionarTurnoModal;