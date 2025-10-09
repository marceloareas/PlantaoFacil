import './App.css';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Header from './components/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import CalendarPage from './components/Caledar';
import 'bootstrap/dist/css/bootstrap.min.css';
import EscalaDoDia from './pages/EscalaDoDia/EscalaDoDia';

function App() {

  const [showMenu, setShowMenu] = useState(false);
  const [showRelat, setShowRelat] = useState(false);

  function Home() {
    // const navigate = useNavigate();
    return (
      <h1>
        Bem vindo ao Plantão Fácil!
      </h1>
    );
  }

  return (
    <Router>
      {/* Menu fullscreen renderizado acima de tudo */}
      {showMenu && (
        <div className="fullscreen-menu">
          <button className="close-button" onClick={() => setShowMenu(false)}>×</button>

          <ul className="menu">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRelat((prev) => !prev);
                }}
                className="menu-link"
              >
                Relatórios ▼
              </a>

              {showRelat && (
                <ul className="submenu"> {/* submenu específico */}
                  <li>
                    <a href="/relatorio1" onClick={() => setShowMenu(false)}>Relatório 1</a>
                  </li>
                  <li>
                    <a href="/relatorio2" onClick={() => setShowMenu(false)}>Relatório 2</a>
                  </li>
                </ul>
              )}
            </li>
            {!showRelat && (
              <>
                < li > <a href="/Calendar" onClick={() => setShowMenu(false)}>Calendário</a></li>
                <li><a href="/settings" onClick={() => setShowMenu(false)}>Configurações</a></li>
                <li><a href="/help" onClick={() => setShowMenu(false)}>Ajuda</a></li>
              </>
            )}

          </ul>

        </div>
      )
      }


      <Header onOpenMenu={() => setShowMenu(true)} />
      <div className='bgImage'>
        <div className='Container-App'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/SignUp" element={<SignUpPage />} />
            <Route path="/Calendar" element={<CalendarPage/>} />
            <Route path="/escalaDoDia/:data" element={<EscalaDoDia />} />
          </Routes>
        </div>
      </div>
    </Router >

  );
}

export default App;
