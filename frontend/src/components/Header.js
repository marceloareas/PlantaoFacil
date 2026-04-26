import './Header.css';
import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import LoginModal from '../pages/LoginPage';
import SignUpModal from '../pages/SignUpPage';
import { PiStethoscopeFill } from "react-icons/pi";
import { IoNotifications, IoHome } from "react-icons/io5";
import { HiOutlineMenuAlt3 } from "react-icons/hi";

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
          <li><NavLink to="/" end> <IoHome /> </NavLink></li>

          <li>
            {user ? (
              <a className="login-button" onClick={onOpenMenu}>
                <strong>{user.nome_completo.split(" ").slice(0, 2).join(" ")}</strong> 
                ({user.cargo}) <HiOutlineMenuAlt3 />
              </a>
            ) : (
              <button className="login-button" onClick={() => setShowLogin(true)}>
                Login
              </button>
            )}
          </li>

          {user && (
            <>
              <li>
                {user.cargo === "Coordenador" ? (
                  <NavLink className="login-button notification-btn" to="/TrocasAprovacao">
                    <IoNotifications />
                    {notificacoesCount > 0 && (
                      <span className="badge">{notificacoesCount}</span>
                    )}
                  </NavLink>
                ) : (
                  <NavLink className="login-button notification-btn" to="/Trocas">
                    <IoNotifications />
                    {notificacoesCount > 0 && (
                      <span className="badge">{notificacoesCount}</span>
                    )}
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
