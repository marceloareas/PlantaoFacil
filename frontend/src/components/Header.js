import './Header.css';
import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import LoginModal from '../pages/LoginPage';
import SignUpModal from '../pages/SignUpPage';
import { PiStethoscopeFill } from "react-icons/pi";
import { IoHome } from "react-icons/io5";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { FaHospital, FaExchangeAlt } from "react-icons/fa";
import { isGestor } from "./utils/perfis";

const Header = ({ onOpenMenu, user, onLogout, setor, onTrocarSetor }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const gestor = isGestor(user);

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

          {user && setor && (
            <li>
              {gestor ? (
                <button className="login-button" onClick={onTrocarSetor} title="Trocar setor">
                  <FaHospital /> <strong>{setor.nome}</strong> <FaExchangeAlt size={12} />
                </button>
              ) : (
                <span className="setor-label">
                  <FaHospital /> <strong>{setor.nome}</strong>
                </span>
              )}
            </li>
          )}

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
