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
import FuncionariosAusentes from './pages/FuncAusente';
import ApiServer from './components/api/Api';
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
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
        <EscalaDaSemana />
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
                        <a href="/relatorio1" onClick={() => setShowMenu(false)}>Relatório 1</a>
                      </li>
                      <li>
                        <a href="/relatorio2" onClick={() => setShowMenu(false)}>Relatório 2</a>
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
        />

      <div className='bgImage'>
        <BackButton /> 
        <div className='Container-App'>

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
            <Route path="/EditarEscala/:data" element={<EditarEscala />} />
          </Routes>
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

    </Router>
  );
}

export default App;
