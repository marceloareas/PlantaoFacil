import { useNavigate, useLocation } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // rotas onde o botão não deve aparecer
  const hiddenRoutes = ["/"];

  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    // se a página anterior for do mesmo site, volta normalmente
    if (referrer && referrer.startsWith(currentOrigin)) {
      navigate(-1);
    } else {
      // sen nao for do site volta para tela inicial
      navigate("/");
    }
  };

  return (
    <button className="back-button" onClick={handleBack}>
      ← Voltar
    </button>
  );
}

export default BackButton;