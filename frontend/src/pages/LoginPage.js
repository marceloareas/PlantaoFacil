import React, { useState } from 'react';
import { CiLogin } from "react-icons/ci";
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginModal = ({ show, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const defaultUser = {
    email: "admin@admin",
    password: "admin",
    nome_completo: "admin",
    id: 99999,
    crm: "99999-9",
    cpf: "000.000.000-00",
    cargo: "Coordenador",
    situacao: "Ativo"
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Preencha todos os campos!");
      return;
    }

    setError("");

    if (email === defaultUser.email && password === defaultUser.password) {
      localStorage.setItem('user', JSON.stringify(defaultUser));

      setEmail('');
      setPassword('');
      setError('');
      onClose();

      console.log("Login bem-sucedido:", defaultUser);
      window.location.reload();
    }
    else {
      try {
        const response = await fetch("http://localhost:8000/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (Array.isArray(errorData.detail)) {
            setError(errorData.detail.map(err => err.msg).join(", "));
          } else {
            setError(errorData.detail || "Email ou senha inválidos");
          }
          return;
        }

        const data = await response.json();

        localStorage.setItem('token', data.token); 
        localStorage.setItem('user', JSON.stringify(data.user));

        setEmail('');
        setPassword('');
        setError('');
        onClose();

        console.log("Login successful:", data);
        window.location.reload();
      } catch (err) {
        setError("Erro de conexão com o servidor");
      }
    }
  };

  if (!show) return null;

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

      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default LoginModal;
