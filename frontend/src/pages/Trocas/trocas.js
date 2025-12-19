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
  const [erro, setErro] = useState("");

  const [idEdicao, setIdEdicao] = useState(null);

  const [diaColega, setDiaColega] = useState("");
  const [troca, setTroca] = useState({
    meuDia: "",
    meuHorario: "",
    destinatario: "",
    horarioColega: "",
    motivo: ""
  });

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

      setTrocasUsuario(data.filter(t => t.solicitante === usuario.nome_completo));
      setTrocasParaMim(data.filter(t => t.destinatario === usuario.nome_completo));
    } catch {
      setErro("Erro ao carregar trocas.");
    }
  };

  useEffect(() => {
    if (user) carregarTrocas(user);
  }, [user]);

  useEffect(() => {
    if (!troca.meuDia || !user) {
      setMeusHorarios([]);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `${API}/escaladodia/${formatarDataParaURL(troca.meuDia)}`
        );
        const data = await res.json();

        const horarios = (data.Escala || [])
          .filter(e => e.Nome === user.nome_completo)
          .map(e => e.Horario);

        setMeusHorarios(horarios);
        setErro(horarios.length ? "" : "Você não está escalado para esse dia.");
      } catch {
        setErro("Erro ao buscar seus horários.");
      }
    };

    load();
  }, [troca.meuDia, user]);

  useEffect(() => {
    if (!diaColega || !user) {
      setColegasDisponiveis([]);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `${API}/escaladodia/${formatarDataParaURL(diaColega)}`
        );
        const data = await res.json();

        const colegasUnicos = Array.from(
          new Map(
            (data.Escala || [])
              .filter(e => e.Cargo === user.cargo && 
                e.Nome !== user.nome_completo)
                
                .map(e => [e.Nome, { nome: e.Nome }])
              ).values()
            );
        setColegasDisponiveis(colegasUnicos);
        setErro(colegasUnicos.length ? "" : "Nenhum colega escalado neste dia.");
      } catch {
        setErro("Erro ao buscar colegas.");
      }
    };

    load();
  }, [diaColega, user]);

  useEffect(() => {
    if (!diaColega || !troca.destinatario) {
      setHorariosColega([]);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `${API}/escaladodia/${formatarDataParaURL(diaColega)}`
        );
        const data = await res.json();

        const horarios = (data.Escala || [])
          .filter(e => e.Nome === troca.destinatario)
          .map(e => e.Horario);

        setHorariosColega(horarios);
        setErro(horarios.length ? "" : "Esse colaborador não tem horário.");
      } catch {
        setErro("Erro ao buscar horários do colega.");
      }
    };

    load();
  }, [troca.destinatario, diaColega]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTroca(prev => ({ ...prev, [name]: value }));
  };

  const abrirEdicao = (t) => {
    setIdEdicao(t.id);
    setTroca({
      meuDia: t.meudia,
      meuHorario: t.horariosolicitante,
      destinatario: t.destinatario,
      horarioColega: t.horariodestinatario,
      motivo: t.motivo || ""
    });
    setDiaColega(t.diacolega);
  };

  const cancelarEdicao = () => {
    setIdEdicao(null);
    setTroca({
      meuDia: "",
      meuHorario: "",
      destinatario: "",
      horarioColega: "",
      motivo: ""
    });
    setDiaColega("");
    setErro("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!troca.meuDia || !troca.meuHorario || !diaColega || !troca.destinatario || !troca.horarioColega) {
      return setErro("Preencha todos os campos obrigatórios.");
    }

    const payload = {
      solicitante: user.nome_completo,
      destinatario: troca.destinatario,
      meudia: troca.meuDia,
      horariosolicitante: troca.meuHorario,
      diacolega: diaColega,
      horariodestinatario: troca.horarioColega,
      motivo: troca.motivo
    };

    try {
      const res = await fetch(
        idEdicao ? `${API}/trocas/${idEdicao}` : `${API}/trocas/`,
        {
          method: idEdicao ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            idEdicao ? payload : { ...payload, situacao: "Aguardando Destinatario" }
          )
        }
      );

      if (!res.ok) throw new Error();

      cancelarEdicao();
      carregarTrocas(user);
    } catch {
      setErro("Erro ao salvar solicitação.");
    }
  };

  const handleDelete = async (id, situacao) => {
  
    const confirm = window.confirm(
      "Tem certeza que deseja deletar esta solicitação? Esta ação não pode ser desfeita."
    );
    if (!confirm) return; 

    if (situacao !== "Pendente" && situacao !== "Aguardando Destinatario") {
      return setErro("Só é possível deletar solicitações pendentes ou aguardando destinatário.");
    }

    try {
      const res = await fetch(`${API}/trocas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      setTrocasUsuario(prev => prev.filter(t => t.id !== id));
    } catch {
      setErro("Erro ao deletar.");
    }
  };

  const aceitarComoDestinatario = async (id) => {
    try {
      await fetch(`${API}/trocas/${id}/destinatario-aprovar`, { method: "PUT" });
      carregarTrocas(user);
    } catch {
      setErro("Erro ao aceitar solicitação.");
    }
  };

  const rejeitarComoDestinatario = async (id) => {
    try {
      await fetch(`${API}/trocas/${id}/destinatario-rejeitar`, { method: "PUT" });
      carregarTrocas(user);
    } catch {
      setErro("Erro ao rejeitar solicitação.");
    }
  };

  return (
    <div className="troca-container">
      {erro && <div className="erro-box">{erro}</div>}

      <h2>{idEdicao ? "Editar Solicitação de Troca" : "Solicitar Troca de Plantão"}</h2>

      {user && user.cargo !== "Coordenador" ? (
        <>
          <form onSubmit={handleSubmit} className="troca-form">

            <label>Dia do seu plantão:</label>
            <input
              type="date"
              name="meuDia"
              value={troca.meuDia}
              onChange={handleChange}
              min={new Date().toLocaleDateString("en-CA")}
              required
            />

            {meusHorarios.length > 0 && (
              <>
                <label>Seu horário:</label>
                <select name="meuHorario" value={troca.meuHorario} onChange={handleChange}>
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
              value={diaColega}
              onChange={(e) => setDiaColega(e.target.value)}
              min={new Date().toLocaleDateString("en-CA")}
              required
            />

            {colegasDisponiveis.length > 0 && (
              <>
                <label>Colaborador:</label>
                <select name="destinatario" value={troca.destinatario} onChange={handleChange}>
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
                <select name="horarioColega" value={troca.horarioColega} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  {horariosColega.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </>
            )}

            <label>Motivo (opcional):</label>
            <textarea name="motivo" value={troca.motivo} onChange={handleChange} rows="3" />

            <button type="submit" className="enviar-btn">
              {idEdicao ? "Salvar Alterações" : "Enviar Solicitação"}
            </button>

            {idEdicao && (
              <button type="button" className="cancelar-btn" onClick={cancelarEdicao}>
                Cancelar edição
              </button>
            )}
          </form>

          <div className="minhas-trocas">
            <h3>Minhas Solicitações</h3>

            {trocasUsuario.length === 0 ? (
              <p>Você ainda não fez nenhuma solicitação.</p>
            ) : (
              <table className="tabela-trocas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Meu dia</th>
                    <th>Meu horário</th>
                    <th>Dia colega</th>
                    <th>Horário colega</th>
                    <th>Destinatário</th>
                    <th>Situação</th>
                    <th>Motivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {trocasUsuario.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.meudia}</td>
                      <td>{t.horariosolicitante}</td>
                      <td>{t.diacolega}</td>
                      <td>{t.horariodestinatario}</td>
                      <td>{t.destinatario}</td>
                      <td>{t.situacao}</td>

                      <td>{t.motivo || "—"}</td>
                      <td>
                        {(t.situacao === "Aguardando Destinatario") && (
                          <>
                            <button className="edit-btn" onClick={() => abrirEdicao(t)}>Editar</button>
                            <button className="delete-btn" onClick={() => handleDelete(t.id, t.situacao)}>Deletar</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="trocas-para-mim">
            <h3>Solicitações de Terceiros</h3>

            {trocasParaMim.length === 0 ? (
              <p>Nenhuma solicitação para você.</p>
            ) : (
              <table className="tabela-trocas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Solicitante</th>
                    <th>Dia</th>
                    <th>Horário</th>
                    <th>Dia (seu)</th>
                    <th>Horário (seu)</th>
                    <th>Situação</th>
                    <th>Motivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trocasParaMim.map(t => (
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
                        {t.situacao === "Aguardando Destinatario" && (
                          <>
                            <button className="btn-aprovar" onClick={() => aceitarComoDestinatario(t.id)}>Aceitar</button>
                            <button className="btn-rejeitar" onClick={() => rejeitarComoDestinatario(t.id)}>Rejeitar</button>
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
        <p>Você não tem acesso a esta página.</p>
      )}
    </div>
  );
};

export default Trocas;
