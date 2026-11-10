import { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaQuestionCircle,
    FaTimesCircle,
} from "react-icons/fa";
import "./Mensagens.css";

// Substitui alert(), confirm() e prompt() do navegador por janelas no estilo do app.
// Uso: await avisar("texto", { variante: "sucesso" }); if (await confirmar("texto")) ...

const VARIANTES = {
    sucesso: { icone: FaCheckCircle, titulo: "Tudo certo!" },
    erro: { icone: FaTimesCircle, titulo: "Algo deu errado" },
    atencao: { icone: FaExclamationTriangle, titulo: "Atenção" },
    info: { icone: FaInfoCircle, titulo: "Aviso" },
    pergunta: { icone: FaQuestionCircle, titulo: "Confirmação" },
};

const fila = [];
let atualizarHost = null;

const enfileirar = (mensagem) =>
    new Promise((resolve) => {
        fila.push({ ...mensagem, resolve });
        if (atualizarHost) atualizarHost();
    });

export const avisar = (texto, { titulo, variante = "info", textoOk = "OK" } = {}) =>
    enfileirar({ tipo: "aviso", texto, titulo, variante, textoOk });

export const confirmar = (
    texto,
    { titulo, variante = "pergunta", textoOk = "Confirmar", textoCancelar = "Cancelar" } = {}
) => enfileirar({ tipo: "confirmacao", texto, titulo, variante, textoOk, textoCancelar });

// devolve o texto digitado ou null se o usuário cancelar
export const perguntar = (
    texto,
    { titulo, valorInicial = "", variante = "pergunta", textoOk = "Salvar", textoCancelar = "Cancelar" } = {}
) => enfileirar({ tipo: "pergunta", texto, titulo, valorInicial, variante, textoOk, textoCancelar });

// uma mensagem para cada funcionário que acabou de receber plantão extra (resposta do servidor: extras_alocados)
export const avisarExtrasAlocados = async (extras = []) => {
    for (const extra of extras) {
        await avisar(
            `Funcionário ${extra.nome} agora está em ${extra.plantoes} plantões nesse período. ` +
            `Máximo permitido é ${extra.limite}.`,
            { titulo: "Plantão extra alocado", variante: extra.plantoes > extra.limite ? "atencao" : "info" }
        );
    }
};

export const MensagensHost = () => {
    const [atual, setAtual] = useState(null);
    const [valor, setValor] = useState("");
    const campoRef = useRef(null);

    useEffect(() => {
        atualizarHost = () => setAtual((a) => a || fila[0] || null);
        atualizarHost();
        return () => {
            atualizarHost = null;
        };
    }, []);

    useEffect(() => {
        if (atual?.tipo === "pergunta") setValor(atual.valorInicial || "");
    }, [atual]);

    if (!atual) return null;

    const fechar = (resposta) => {
        fila.shift();
        atual.resolve(resposta);
        setAtual(fila[0] || null);
    };

    const cancelar = () => {
        if (atual.tipo === "aviso") fechar(true);
        else if (atual.tipo === "pergunta") fechar(null);
        else fechar(false);
    };

    const ok = () => fechar(atual.tipo === "pergunta" ? valor : true);

    const variante = VARIANTES[atual.variante] ? atual.variante : "info";
    const { icone: Icone, titulo: tituloPadrao } = VARIANTES[variante];

    return (
        <Modal
            show
            centered
            onHide={cancelar}
            onEntered={() => campoRef.current?.focus()}
            className="mensagem-modal"
            backdropClassName="mensagem-backdrop"
            contentClassName={`mensagem-conteudo mensagem-${variante}`}
        >
            <Modal.Body className="mensagem-corpo">
                <div className="mensagem-icone">
                    <Icone />
                </div>
                <h5 className="mensagem-titulo">{atual.titulo || tituloPadrao}</h5>
                <p className="mensagem-texto">{atual.texto}</p>

                {atual.tipo === "pergunta" && (
                    <input
                        ref={campoRef}
                        type="text"
                        className="form-control mensagem-campo"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") ok();
                        }}
                    />
                )}

                <div className="mensagem-botoes">
                    {atual.tipo !== "aviso" && (
                        <button type="button" className="mensagem-botao mensagem-botao-secundario" onClick={cancelar}>
                            {atual.textoCancelar}
                        </button>
                    )}
                    <button
                        type="button"
                        className="mensagem-botao mensagem-botao-principal"
                        onClick={ok}
                        autoFocus={atual.tipo !== "pergunta"}
                    >
                        {atual.textoOk}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default MensagensHost;
