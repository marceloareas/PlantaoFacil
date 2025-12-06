import { useState, useEffect } from "react";
import "./trocas.css";

const API = "http://localhost:8000";

const Trocas = () => {
  const [user, setUser] = useState(null);
  const [meusHorarios, setMeusHorarios] = useState([]);
  const [colegasDisponiveis, setColegasDisponiveis] = useState([]);
  const [horariosColega, setHorariosColega] = useState([]);
  const [trocasUsuario, setTrocasUsuario] = useState([]);
  const [trocasParaMim, setTrocasParaMim] = useState([]);
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
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const carregarTrocas = async (usuario) => {
    if (!usuario) return;
    try {
      const res = await fetch(`${API}/trocas/`);
      const data = await res.json();

      const minhas = data.filter((t) => t.solicitante === usuario.nome_completo);
      setTrocasUsuario(minhas);

      const paraMim = data.filter(
        (t) =>
          t.destinatario === usuario.nome_completo
      );
      setTrocasParaMim(paraMim);
    } catch (err) {
      console.error("Erro ao carregar trocas:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    carregarTrocas(user);
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
        const res = await fetch(`${API}/escaladodia/${dataParaURL}`);
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
        const res = await fetch(`${API}/escaladodia/${dataParaURL}`);
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
        const res = await fetch(`${API}/escaladodia/${dataParaURL}`);
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
      situacao: "Aguardando Destinatario"
    };

    try {
      const res = await fetch(`${API}/trocas/`, {
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

      carregarTrocas(user);
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
      const res = await fetch(`${API}/trocas/${id}`, {
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

  const aceitarComoDestinatario = async (id) => {
    try {
      const res = await fetch(`${API}/trocas/${id}/destinatario-aprovar`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Erro ao aceitar solicitação");
      carregarTrocas(user);
      alert("Você aceitou a solicitação. Agora está Pendente e aguardando coordenador.");
    } catch (err) {
      console.error(err);
      alert("Erro ao aceitar solicitação.");
    }
  };

  const rejeitarComoDestinatario = async (id) => {
    if (!window.confirm("Deseja recusar esta solicitação?")) return;
    try {
      const res = await fetch(`${API}/trocas/${id}/destinatario-rejeitar`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Erro ao rejeitar solicitação");
      carregarTrocas(user);
      alert("Solicitação rejeitada pelo destinatário.");
    } catch (err) {
      console.error(err);
      alert("Erro ao rejeitar solicitação.");
    }
  };

  const carregar = () => {
    carregarTrocas(user);
  };

  return (
    <div className="troca-container">
      <h2>Solicitar Troca de Plantão</h2>

      {user && user.cargo !== "Coordenador" ? (
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
                  {[...new Set(colegasDisponiveis.map(c => c.nome))].map((nome, i) => (
                    <option key={i} value={nome}>{nome}</option>
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
                    <th>Situação</th>
                    <th>Motivo</th>
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
                      <td>
                        {t.motivo}
                      </td>
                      <td>
                        {t.situacao === "Pendente" && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(t.id, t.situacao)}
                          >
                            Deletar
                          </button>
                        )}
                        {t.situacao === "Aguardando Destinatario" && (
                          <button
                            className="delete-btn"
                            onClick={() => {
                              if (!window.confirm("Cancelar solicitação?")) return;
                              fetch(`${API}/trocas/${t.id}`, { method: "DELETE" })
                                .then(r => {
                                  if (!r.ok) throw new Error("Não foi possível cancelar");
                                  alert("Solicitação cancelada");
                                  carregarTrocas(user);
                                })
                                .catch(err => {
                                  console.error(err);
                                  alert("Não foi possível cancelar (backend pode exigir outro estado).");
                                  carregarTrocas(user);
                                });
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="trocas-para-mim" style={{ marginTop: 28 }}>
            <h3>Solicitações de Terceiros</h3>
            {trocasParaMim.length === 0 ? (
              <p>Não há solicitações.</p>
            ) : (
              <table className="tabela-trocas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Solicitante</th>
                    <th>Dia (solicitante)</th>
                    <th>Horário</th>
                    <th>Dia (seu)</th>
                    <th>Horário (seu)</th>
                    <th>Situação</th>
                    <th>Motivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trocasParaMim.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.solicitante}</td>
                      <td>{t.meudia}</td>
                      <td>{t.horariosolicitante}</td>
                      <td>{t.diacolega}</td>
                      <td>{t.horariodestinatario}</td>
                      <td>{t.situacao}</td>
                      <td>{t.motivo || "—"}</td>
                      <td>
                        {t.situacao == "Aguardando Destinatario" && (
                          <>
                            <button
                              className="btn-aprovar"
                              onClick={() => aceitarComoDestinatario(t.id)}
                            >
                              Aceitar
                            </button>
                            <button
                              className="btn-rejeitar"
                              onClick={() => rejeitarComoDestinatario(t.id)}
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <p> Você não tem acesso a esta página</p>
      )}
    </div>
  );
};

export default Trocas;
