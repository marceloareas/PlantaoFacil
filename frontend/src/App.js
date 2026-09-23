import './App.css';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Header from './components/Header';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CalendarPage from './pages/Calendar/Calendar';
import 'bootstrap/dist/css/bootstrap.min.css';
import EscalaDoDia from './pages/EscalaDoDia/EscalaDoDia';
import EditarEscala from './pages/EditarEscala/EditarEscala';
import EscalaDaSemana from './pages/EscalaDaSemana/EscalaDaSemana';
import FuncionariosAusentes from './pages/indisponibilidade/FuncAusente';
import RelatorioSemanal from './pages/RelatorioSemanal/RelatorioSemanal';
import RelatorioPeronalizado from './pages/RelatorioPersonalizado/RelatorioPersonalizado';
import RelatorioMensal from './pages/RelatorioMensal/RelatorioMensal';
import ApiServer, { getSetorAtual, setSetorAtual } from './components/api/Api';
import SetorSelectorModal from './components/SetorSelectorModal';
import Setores from './pages/Setores/Setores';
import { IoPersonCircleSharp } from "react-icons/io5";
import TrocasAprovacao from './pages/Trocas/TrocasAprovacao';
import Trocas from './pages/Trocas/trocas';
import Pessoas from './pages/Pessoas/Pessoas';
import { Button } from 'bootstrap';
import HelpPage from './pages/Help/HelpPage';
import BackButton from './components/BackButton';




function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [showRelat, setShowRelat] = useState(false);
  // lido já no primeiro render para as páginas não buscarem dados antes de haver setor escolhido
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [setorAtual, setSetorAtualState] = useState(getSetorAtual);
  const [showSetorModal, setShowSetorModal] = useState(false);

  const precisaEscolherSetor = user?.cargo === "Coordenador" && !setorAtual;

  const selecionarSetor = (setor) => {
    const trocou = setorAtual && setor?.id !== setorAtual.id;
    setSetorAtual(setor);
    setSetorAtualState(setor ? { id: setor.id, nome: setor.nome } : null);
    setShowSetorModal(false);
    // recarrega para que todas as telas busquem os dados do novo setor
    if (trocou) window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSetorAtual(null);
    setUser(null);
    setShowMenu(false);
    window.location.reload();
    window.location.href = '/';
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setShowLogin(false);
    setShowMenu(false);
  };

  function Home() {
    const [titulo, setTitulo] = useState("Bem vindo ao Plantão Fácil!");

    useEffect(() => {
      async function fetchUsuarios() {
        try {
          const response = await fetch(ApiServer());
          if (!response.ok) throw new Error("Erro ao buscar dados da API");
          await response.json();
          setTitulo(`Bem vindo ao Plantão Fácil!`);
        } catch (error) {
          console.error("Erro:", error);
          setTitulo("Sem Conexão com o Banco");
        }
      }
      fetchUsuarios();
    }, []);

    return (
      <div>
        <h1 style={{ marginLeft: "20px" }}>{titulo}</h1>
        {user ? (
          <EscalaDaSemana />
        ) : (
          <p style={{ marginLeft: "20px" }}>Faça login para visualizar a escala do seu setor.</p>
        )}
      </div>
    );
  }

  return (
    <Router>
      
      {showMenu && (
        <div className="fullscreen-menu">
          <button className="close-button" onClick={() => setShowMenu(false)}>×</button>
          <ul className="menu">
            {!user ? (
              <li>
                <a className="menu-link" onClick={() => { setShowLogin(true); setShowMenu(false); }}>Login</a>
              </li>
            ) : (
              <>
                <li>
                  <a className="menu-username"><IoPersonCircleSharp /><strong>{user.nome_completo}</strong> ({user.cargo})</a>
                </li>
              </>
            )}

              {user && user.cargo === "Coordenador" && (
                <>
                  <li>
                  <button className="menu-link"
                    onClick={() => {setShowRelat((prev) => !prev);
                    }}
                    
                  >
                    Relatórios
                  </button>
                  {showRelat && (
                    <ul className="menu-link">
                      <li>
                        <a href="/RelatorioSemanal" onClick={() => setShowMenu(false)}>RelatórioSemanal</a>
                      </li> 
                      <li>
                        <a href="/RelatorioMensal" onClick={() => setShowMenu(false)}>RelatórioMensal</a>
                      </li>  
                      <li>
                        <a href="/RelatorioPersonalizado" onClick={() => setShowMenu(false)}>RelatórioPersonalizado</a>
                      </li>
                    </ul>
                  )}
                  </li>
                </>
              )}
            
            {!showRelat && (
              <>

                 {user && user.cargo === "Coordenador" && (
                <>
                  <li>
                    <button className="menu-link" onClick={() => setShowSignUp(true)}>
                      Cadastrar
                    </button>
                  </li>
                </>
              )}

                <li><a href="/Calendar" onClick={() => setShowMenu(false)}>Calendário</a></li>
                {user?.cargo === "Coordenador" && (
                  <>
                <li><a href='/Ausentes' onClick={() => setShowMenu(false)}>Indisponibilidades</a></li>
                    <li><a href="/Pessoas" onClick={() => setShowMenu(false)}>Funcionários</a></li>
                    <li><a href="/Setores" onClick={() => setShowMenu(false)}>Setores</a></li>
                    <li><a href="/TrocasAprovacao" onClick={() => setShowMenu(false)}>Trocas para aprovação</a></li>
                  </>
                )}
                {user?.cargo !== "Coordenador" && (
                  <li><a href="/Trocas" onClick={() => setShowMenu(false)}>Trocas</a></li>
                )}
                <li><a href="/help" onClick={() => setShowMenu(false)}>Ajuda</a></li>
                <li>
                  <a className="menu-link" style={{color: 'red'}} onClick={handleLogout}>Logout</a>
                </li>
              </>
            )}
          </ul>
        </div>
      )}

      {(!user || (user && user.situacao !== "Desativado")) && (
      <>
      <Header
        onOpenMenu={() => setShowMenu(true)}
        user={user}
        onLogout={handleLogout}
        setor={setorAtual}
        onTrocarSetor={() => setShowSetorModal(true)}
        />

      <div className='bgImage'>
        <BackButton /> 
        <div className='Container-App'>

          {!precisaEscolherSetor && (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/SignUp" element={<SignUpPage />} />
            <Route path="/Calendar" element={<CalendarPage />} />
            <Route path="/EscalaDoDia/:data" element={<EscalaDoDia />} />
            <Route path="/Ausentes" element={<FuncionariosAusentes />} />
            <Route path="/Trocas" element={<Trocas />} />
            <Route path="/TrocasAprovacao" element={<TrocasAprovacao />} />
            <Route path="/Pessoas" element={<Pessoas />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/RelatorioSemanal" element={<RelatorioSemanal />} />
            <Route path="/RelatorioMensal" element={<RelatorioMensal/>} />
            <Route path="/RelatorioPersonalizado" element={<RelatorioPeronalizado/>} />
            <Route path="/EditarEscala/:data" element={<EditarEscala />} />
            <Route
              path="/Setores"
              element={<Setores user={user} setorAtual={setorAtual} onSetorAtualChange={selecionarSetor} />}
            />
          </Routes>
          )}
        </div>
      </div>
        </>
      )}
      {( (user && user.situacao === "Desativado")) && (
      <div style={{textAlign: "center"}}>
        <h1 style={{ marginLeft: "20px" , color: "red"
        , fontSize: "20px"
        , fontWeight: "bold"
        , textAlign: "center"
        , fontFamily: "Arial, sans-serif"
        , textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)"
        , letterSpacing: "2px"
        , textTransform: "uppercase"
        , lineHeight: "1.5"
        , wordSpacing: "4px"
       }} onClick={handleLogout}> Você não tem permissão para acessar essa pagina</h1>
      <button style ={{marginLeft: "20px", backgroundColor: "red", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer"}} onClick={handleLogout}>Voltar</button>
      </div>
      )}
      <LoginPage
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignUpPage
        show={showSignUp}
        onClose={() => setShowSignUp(false)}
      />
      <SetorSelectorModal
        show={precisaEscolherSetor || showSetorModal}
        setorAtual={setorAtual}
        onSelect={selecionarSetor}
        onClose={() => setShowSetorModal(false)}
      />

    </Router>
  );
}

export default App;
