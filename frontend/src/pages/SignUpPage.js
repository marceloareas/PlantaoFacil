import React, { useState } from 'react';
import { CiLogin } from "react-icons/ci";
import 'bootstrap/dist/css/bootstrap.min.css';

const SignUpModal = ({ show, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [crms, setCrms] = useState('');
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [horaEscala, sethoraEscala] = useState('12x36');
  const [cargo, setCargo] = useState('Tecnico');
  const [error, setError] = useState('');
  const [cpfValido, setCpfValido] = useState(null);

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11) return false;
    if (/^(.)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let dig1 = 11 - (soma % 11);
    if (dig1 > 9) dig1 = 0;
    if (dig1 !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let dig2 = 11 - (soma % 11);
    if (dig2 > 9) dig2 = 0;

    return dig2 === parseInt(cpf.charAt(10));
  }

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setCpf(value);

    const cpfNumerico = value.replace(/\D/g, "");
    if (cpfNumerico.length === 11) {
      setCpfValido(validarCPF(cpfNumerico));
    } else {
      setCpfValido(null);
    }
  };

  const handleCoren = (coren) => {
    const value = coren.trim().toUpperCase();
    const regex = /^[0-9]{3,6}-[A-Z]{2}\/(ENF|TE|AE|OBST)$/;

    if (!regex.test(value)) {
      return {
        valido: false,
        mensagem: "Formato inválido! Use o padrão: XXXXXX-YY/ZZZZ"
      };
    }

    return { valido: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cpfValido === false) {
      setError("CPF inválido!");
      return;
    }

    if (!email || !password || !cpf || !name || !crms || !cargo || !horaEscala) {
      setError("Preencha todos os campos obrigatórios!");
      return;
    }

    const corenValidacao = handleCoren(crms);
    if (!corenValidacao.valido) {
      setError(corenValidacao.mensagem);
      return;
    }

    setError("");

    const payload = {
      nome_completo: name,
      email,
      password,
      crm: crms,
      cpf,
      cargo,
      horaEscala: horaEscala,
      situacao: "Ativo"
    };

    try {
      const response = await fetch("http://localhost:8000/usuario/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => err.msg).join(", ");
          setError(messages);
        } else {
          setError(errorData.detail || "Erro ao criar usuário");
        }
        return;
      }

      setEmail('');
      setPassword('');
      setCrms('');
      setCpf('');
      setName('');
      setCargo('Tecnico');
      sethoraEscala('12x36');
      setError('');
      onClose();

      alert("Usuário criado com sucesso!");
      window.location.reload();

    } catch (err) {
      setError("Erro de conexão com o servidor");
    }
  };

  const handleOnClose = async (e) => {
    setEmail('');
    setPassword('');
    setCrms('');
    setCpf('');
    setName('');
    setCargo('Tecnico');
    sethoraEscala('12x36');
    setError('');
    setCpfValido('');
    return;
  }


  if (!show) return null;

  return (
    <>
      <div className="modal show fade d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                <CiLogin size={28} className="text-primary me-2" />
                Cadastrar
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  handleOnClose();
                  onClose();
                }}
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
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Coren</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder='Ex: 123456-RJ/ENF'
                    value={crms}
                    onChange={(e) => setCrms(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    className={`form-control ${cpfValido === false ? "is-invalid" : ""}`}
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    required
                  />
                  {cpfValido === false && (
                    <span className="text-danger">CPF inválido</span>
                  )}
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
                  <select
                    className="form-control"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  >
                    <option value="Tecnico">Técnico(a) de Enfermagem</option>
                    <option value="Enfermeiro">Enfermeiro(a)</option>
                    <option value="Coordenador">Coordenador</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Hora de Escala</label>
                  <select
                    className="form-control"
                    value={horaEscala}
                    onChange={(e) => sethoraEscala(e.target.value)}
                    required
                  >
                    <option value="12x36">12x36</option>
                    <option value="12x60">12x60</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Cadastrar
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
