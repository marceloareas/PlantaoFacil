import React, { useState } from 'react';
import { CiLogin } from "react-icons/ci";
import 'bootstrap/dist/css/bootstrap.min.css';

const SignUpModal = ({ show, onClose }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [crms, setCrms] = useState('');
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('');
  const [error, setError] = useState('');

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || !cpf) {
      setError("Preencha todos os campos obrigatórios!");
      return;
    }
    setError("");
    onClose(); 
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
                Sign Up
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
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
                
                <div className="mb-3">
                  <label className="form-label">CRM</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={crms} 
                    onChange={(e) => setCrms(e.target.value)} 
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">CPF</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={cpf} 
                    onChange={handleCpfChange} 
                    maxLength={14} 
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Cargo</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={cargo} 
                    onChange={(e) => setCargo(e.target.value)} 
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Sign-Up
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

export default SignUpModal;
