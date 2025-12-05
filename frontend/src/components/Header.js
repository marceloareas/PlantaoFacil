import './Header.css';
import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import LoginModal from '../pages/LoginPage';
import SignUpModal from '../pages/SignUpPage';
import { PiStethoscopeFill } from "react-icons/pi";

const Header = ({ onOpenMenu, user, onLogout }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

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
              <>
                <button className="login-button" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="login-button" onClick={() => setShowLogin(true)}>
                Login
              </button>
            )}
          </li>

          {user && user.cargo === "Coordenador" && (
            <li>
              <button className="login-button" onClick={() => setShowSignUp(true)}>
                SignUp
              </button>
            </li>
          )}
          {user && (
            <li>
            <button className="login-button" onClick={onOpenMenu}>
              Menu
            </button>
          </li>
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
