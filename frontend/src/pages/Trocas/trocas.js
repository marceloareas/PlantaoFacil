import { useState, useEffect } from "react";
import "./trocas.css";

const Trocas = () => {
  const [user, setUser] = useState(null);
  const [meusHorarios, setMeusHorarios] = useState([]);
  const [colegasDisponiveis, setColegasDisponiveis] = useState([]);
  const [horariosColega, setHorariosColega] = useState([]);
  const [trocasUsuario, setTrocasUsuario] = useState([]);
  const [troca, setTroca] = useState({
    meuDia: "",
    meuHorario: "",
    destinatario: "",
    horarioColega: "",
    motivo: ""
  });
  const [diaColega, setDiaColega] = useState("");

  const formatarDataParaURL = (dataISO) => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}-${mes}-${ano}`;
  };

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchMinhasTrocas = async () => {
      try {
        const res = await fetch(`http://localhost:8000/trocas/`);
        const data = await res.json();

        const minhasTrocas = data.filter(
          (t) => t.solicitante === user.nome_completo
        );

        setTrocasUsuario(minhasTrocas);
      } catch (err) {
        console.error("Erro ao buscar trocas do usuário:", err);
      }
    };

    fetchMinhasTrocas();
  }, [user]);

  useEffect(() => {
    if (!troca.meuDia || !user) {
      setMeusHorarios([]);
      setTroca((prev) => ({ ...prev, meuHorario: "" }));
      return;
    }

    const fetchMeusHorarios = async () => {
      try {
        const dataParaURL = formatarDataParaURL(troca.meuDia);
        const res = await fetch(`http://localhost:8000/escaladodia/${dataParaURL}`);
        const dataRes = await res.json();
        const escala = dataRes.Escala || [];

        const horarios = escala
          .filter((e) => e.Nome === user.nome_completo)
          .map((e) => e.Horario);

        setMeusHorarios(horarios);
        setTroca((prev) => ({ ...prev, meuHorario: "" }));
      } catch (err) {
        console.error("Erro ao buscar meus horários:", err);
        setMeusHorarios([]);
      }
    };

    fetchMeusHorarios();
  }, [troca.meuDia, user]);

  useEffect(() => {
    if (!diaColega || !user) {
      setColegasDisponiveis([]);
      setTroca((prev) => ({ ...prev, destinatario: "" }));
      return;
    }

    const fetchColegasDoDiaColega = async () => {
      try {
        const dataParaURL = formatarDataParaURL(diaColega);
        const res = await fetch(`http://localhost:8000/escaladodia/${dataParaURL}`);
        const dataRes = await res.json();
        const escala = dataRes.Escala || [];

        const colegas = escala
          .filter((e) => e.Cargo === user.cargo && e.Nome !== user.nome_completo)
          .map((e) => ({ nome: e.Nome }));

        setColegasDisponiveis(colegas);
        setTroca((prev) => ({ ...prev, destinatario: "" }));
      } catch (err) {
        console.error("Erro ao buscar colegas do dia do colega:", err);
        setColegasDisponiveis([]);
      }
    };

    fetchColegasDoDiaColega();
  }, [diaColega, user]);

  useEffect(() => {
    if (!troca.destinatario || !diaColega) {
      setHorariosColega([]);
      setTroca((prev) => ({ ...prev, horarioColega: "" }));
      return;
    }

    const fetchHorariosColega = async () => {
      try {
        const dataParaURL = formatarDataParaURL(diaColega);
        const res = await fetch(`http://localhost:8000/escaladodia/${dataParaURL}`);
        const dataRes = await res.json();
        const escala = dataRes.Escala || [];

        const horarios = escala
          .filter((e) => e.Nome === troca.destinatario)
          .map((e) => e.Horario);

        setHorariosColega(horarios);
        setTroca((prev) => ({ ...prev, horarioColega: "" }));
      } catch (err) {
        console.error("Erro ao buscar horários do colega:", err);
        setHorariosColega([]);
      }
    };

    fetchHorariosColega();
  }, [troca.destinatario, diaColega]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTroca((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Usuário não autenticado.");
    if (
      !troca.meuDia ||
      !troca.meuHorario ||
      !troca.destinatario ||
      !troca.horarioColega ||
      !diaColega
    ) {
      return alert("Preencha todos os campos obrigatórios.");
    }

    const payload = {
      solicitante: user.nome_completo,
      destinatario: troca.destinatario,
      meudia: troca.meuDia,
      horariosolicitante: troca.meuHorario,
      diacolega: diaColega,
      horariodestinatario: troca.horarioColega,
      motivo: troca.motivo,
      situacao: "Pendente"
    };

    try {
      const res = await fetch("http://localhost:8000/trocas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erro ao enviar solicitação");

      alert("Solicitação de troca enviada com sucesso!");
      setTroca({
        meuDia: "",
        meuHorario: "",
        destinatario: "",
        horarioColega: "",
        motivo: ""
      });
      setDiaColega("");
      setMeusHorarios([]);
      setColegasDisponiveis([]);
      setHorariosColega([]);

      const todasTrocasRes = await fetch(`http://localhost:8000/trocas/`);
      const todasTrocas = await todasTrocasRes.json();
      const minhasTrocas = todasTrocas.filter(
        (t) => t.solicitante === user.nome_completo
      );
      setTrocasUsuario(minhasTrocas);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar solicitação de troca.");
    }
  };

  const handleDelete = async (id, situacao) => {
    if (situacao !== "Pendente") {
      return alert("Só é possível deletar solicitações com situacao Pendente.");
    }

    if (!window.confirm("Tem certeza que deseja deletar esta solicitação?")) return;

    try {
      const res = await fetch(`http://localhost:8000/trocas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar solicitação");

      alert("Solicitação deletada com sucesso!");
      setTrocasUsuario((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar solicitação.");
    }
  };

  return (
    <div className="troca-container">
      <h2>Solicitar Troca de Plantão</h2>
      {user ? (
        <>
          <form onSubmit={handleSubmit} className="troca-form">
            <label>Dia do plantão:</label>
            <input
              type="date"
              name="meuDia"
              value={troca.meuDia}
              onChange={handleChange}
              required
            />

            {meusHorarios.length > 0 && (
              <>
                <label>Meu horário:</label>
                <select
                  name="meuHorario"
                  value={troca.meuHorario}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  {meusHorarios.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </>
            )}

            <label>Dia do plantão do colega:</label>
            <input
              type="date"
              name="diaColega"
              value={diaColega}
              onChange={(e) => setDiaColega(e.target.value)}
              required
            />

            {diaColega && colegasDisponiveis.length > 0 && (
              <>
                <label>Colaborador para trocar:</label>
                <select
                  name="destinatario"
                  value={troca.destinatario}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  {colegasDisponiveis.map((c, i) => (
                    <option key={i} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </>
            )}

            {horariosColega.length > 0 && (
              <>
                <label>Horário do colega:</label>
                <select
                  name="horarioColega"
                  value={troca.horarioColega}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  {horariosColega.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </>
            )}

            <label>Motivo (opcional):</label>
            <textarea
              name="motivo"
              value={troca.motivo}
              onChange={handleChange}
              rows="3"
            />

            <button type="submit" className="enviar-btn">Enviar Solicitação</button>
          </form>

          <div className="minhas-trocas">
            <h3>Minhas Solicitações de Troca</h3>
            {trocasUsuario.length === 0 ? (
              <p>Você ainda não fez nenhuma solicitação.</p>
            ) : (
              <table className="tabela-trocas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Meu dia</th>
                    <th>Horário</th>
                    <th>Dia colega</th>
                    <th>Destinatário</th>
                    <th>situacao</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trocasUsuario.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.meudia}</td>
                      <td>{t.horariosolicitante}</td>
                      <td>{t.diacolega}</td>
                      <td>{t.destinatario}</td>
                      <td>
                        <span className={`situacao-${(t.situacao || "Pendente").toLowerCase()}`}>
                          {t.situacao || "Pendente"}
                        </span>
                      </td>
                        {t.situacao === "Pendente" && (
                      <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(t.id, t.situacao)}
                          >
                            Deletar
                          </button>
                      </td>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <p>Carregando usuário...</p>
      )}
    </div>
  );
};

export default Trocas;
