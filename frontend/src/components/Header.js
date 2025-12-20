import './Header.css';
import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import LoginModal from '../pages/LoginPage';
import SignUpModal from '../pages/SignUpPage';
import { PiStethoscopeFill } from "react-icons/pi";
import { IoNotifications } from "react-icons/io5";

const API = "http://localhost:8000";

const Header = ({ onOpenMenu, user, onLogout }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [notificacoesCount, setNotificacoesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotificacoes = async () => {
      try {
        const res = await fetch(`${API}/trocas/`);
        const data = await res.json();

        let count = 0;

        if (user.cargo === "Coordenador") {
          count = data.filter(t => t.situacao === "Pendente").length;
        } else {
          count = data.filter(
            t => t.destinatario === user.nome_completo &&
              (t.situacao === "Aguardando Destinatario" || t.situacao === "Aguardando Destinatário")
          ).length;
        }

        setNotificacoesCount(count);
      } catch (err) {
        console.error("Erro ao buscar notificações:", err);
      }
    };

    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className='Container'>
      <h3 className='two alt-two'>
        <NavLink to="/" end>
          <PiStethoscopeFill /> Plantão Fácil
        </NavLink>
      </h3>

      <nav>
        <ul>
          <li><NavLink to="/" end>Home</NavLink></li>

          <li>
            {user ? (
              <button className="login-button" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <button className="login-button" onClick={() => setShowLogin(true)}>
                Login
              </button>
            )}
          </li>

          {user && user.cargo === "Coordenador" && (
            <li>
              <button className="login-button" onClick={() => setShowSignUp(true)}>
                Cadastrar
              </button>
            </li>
          )}

          {user && (
            <>
              <li>
                <button className="login-button" onClick={onOpenMenu}>
                  Menu
                </button>
              </li>

              <li>
                  {user.cargo === "Coordenador" && notificacoesCount > 0 && (
                    <NavLink className="login-button" to="/TrocasAprovacao">
                      <IoNotifications />
                      <span className="badge">{notificacoesCount}</span>
                    </NavLink>
                  )}

                  {user.cargo !== "Coordenador" && notificacoesCount > 0 && (
                    <NavLink className="login-button" to="/Trocas">
                      <IoNotifications />
                      <span className="badge">{notificacoesCount}</span>
                    </NavLink>
                  )}
                </li>

            </>
          )}
        </ul>
      </nav>

      <LoginModal
        show={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <SignUpModal
        show={showSignUp}
        onClose={() => setShowSignUp(false)}
      />
    </div>
  );
};

export default Header;
