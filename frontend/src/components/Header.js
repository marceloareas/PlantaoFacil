import './Header.css';
import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import LoginModal from '../pages/LoginPage';
import SignUpModal from '../pages/SignUpPage';
import { IoPersonCircleSharp } from "react-icons/io5";

const Header = ({ onOpenMenu }) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);


  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    window.location.reload();
  };

  return (
    <div className='Container'>
      <h3 className='two alt-two'>
        <NavLink to="/" end>Plantão Fácil</NavLink>
      </h3>
      <nav>
        <ul>
          <li><NavLink to="/" end>Home</NavLink></li>
          <li>
            {user ? (
              <>
              {console.log(user)}
              {console.log(user.cargo)}
                {/* <span className='two alt-two'>
                  {console.log(user)}
                  Logado como <strong>{user.nome_completo}</strong>
                </span> */}
                <button className="login-button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="login-button" onClick={() => setShowLogin(true)}>Login</button>
            )}
          </li>
          {user && user.cargo === "Coordenador" && (
            <li>
              <button className="login-button" onClick={() => setShowSignUp(true)}>
                SignUp
              </button>
            </li>
          )}
          <li>
            <button className="login-button" onClick={onOpenMenu}>
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
      <SignUpModal show={showSignUp} onClose={() => setShowSignUp(false)} />
    </div>
  );
};

export default Header;
