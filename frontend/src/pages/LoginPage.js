import React, { useState } from 'react';
import { CiLogin } from "react-icons/ci";
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginModal = ({ show, onClose }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === 'user@example.com' && password === '123') {
      alert('Login successful!');
      onClose(); // fecha o modal ao logar com sucesso
    } else {
      setError('Invalid email or password');
    }
  };

  if (!show) return null; // não renderiza nada se estiver fechado

  return (
    <>
      <div className="modal show fade d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                <CiLogin size={28} className="text-primary me-2" />
                Login
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Login
                </button>
              </form>
            </div>


          </div>
        </div>
      </div>

      {/* Fundo escuro do modal */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default LoginModal;
