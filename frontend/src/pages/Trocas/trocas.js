import { useState, useEffect } from "react";
import "./trocas.css";

const Trocas = () => {
    const [user, setUser] = useState(null);
    const [escala, setEscala] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [troca, setTroca] = useState({
        data: "",
        horario: "",
        destinatario: "",
        motivo: ""
    });

    useEffect(() => {
        const userData = sessionStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resUsuarios = await fetch("http://localhost:8000/usuario/");
                const usuariosData = await resUsuarios.json();
                setUsuarios(usuariosData);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTroca({ ...troca, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("Usuário não autenticado.");
            return;
        }

        const payload = {
            solicitante: user.nome_completo,
            destinatario: troca.destinatario,
            data: troca.data,
            horario: troca.horario,
            motivo: troca.motivo,
            status: "Pendente"
        };

        try {
            const res = await fetch("http://localhost:8000/trocas/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Erro ao enviar solicitação");

            alert("Solicitação de troca enviada com sucesso!");
            setTroca({ data: "", horario: "", destinatario: "", motivo: "" });
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar solicitação de troca.");
        }
    };

    return (
        <div className="troca-container">
            <h2>Solicitar Troca de Plantão</h2>
            {user ? (
                <form onSubmit={handleSubmit} className="troca-form">
                    <label>Data da Troca:</label>
                    <input
                        type="date"
                        name="data"
                        value={troca.data}
                        onChange={handleChange}
                        required
                    />

                    <label>Horário:</label>
                    <select
                        name="horario"
                        value={troca.horario}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="08:00 - 12:00">08:00 - 12:00</option>
                        <option value="13:00 - 17:00">13:00 - 17:00</option>
                    </select>

                    <label>Trocar com:</label>
                    <select
                        name="destinatario"
                        value={troca.destinatario}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecione...</option>
                        {usuarios
                            .filter((u) => u.cargo === user.cargo && u.nome_completo !== user.nome_completo)
                            .map((u) => (
                                <option key={u.id} value={u.nome_completo}>
                                    {u.nome_completo}
                                </option>
                            ))}
                    </select>

                    <label>Motivo (opcional):</label>
                    <textarea
                        name="motivo"
                        value={troca.motivo}
                        onChange={handleChange}
                        rows="3"
                    ></textarea>

                    <button type="submit" className="enviar-btn">
                        Enviar Solicitação
                    </button>
                </form>
            ) : (
                <p>Carregando usuário...</p>
            )}
        </div>
    );
};

export default Trocas;
