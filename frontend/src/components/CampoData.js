import { useEffect, useRef, useState } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";

// Campo de data sempre em dd/mm/aaaa. O <input type="date"> segue o idioma do navegador
// e, em navegadores em inglês, mostra mm/dd/aaaa.
// value e onChange continuam em "AAAA-MM-DD", como no input nativo.

const isoParaBR = (iso) =>
    /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("/") : "";

const mascarar = (texto) => {
    const digitos = texto.replace(/\D/g, "").slice(0, 8);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
};

const brParaISO = (texto) => {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
    if (!partes) return null;
    const [, dia, mes, ano] = partes;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const valida =
        data.getFullYear() === Number(ano) &&
        data.getMonth() === Number(mes) - 1 &&
        data.getDate() === Number(dia);
    return valida ? `${ano}-${mes}-${dia}` : null;
};

const CampoData = ({
    value,
    onChange,
    name,
    id,
    className = "form-control",
    style,
    min,
    max,
    required,
    disabled,
}) => {
    const [texto, setTexto] = useState(isoParaBR(value));
    const seletorRef = useRef(null);

    useEffect(() => {
        setTexto(isoParaBR(value));
    }, [value]);

    const emitir = (iso) => onChange?.({ target: { name, value: iso } });

    const digitar = (e) => {
        const novoTexto = mascarar(e.target.value);
        setTexto(novoTexto);
        if (!novoTexto) {
            emitir("");
            return;
        }
        const iso = brParaISO(novoTexto);
        if (iso) emitir(iso);
    };

    const abrirCalendario = () => {
        const seletor = seletorRef.current;
        if (!seletor || disabled) return;
        if (typeof seletor.showPicker === "function") {
            try {
                seletor.showPicker();
                return;
            } catch {
                // alguns navegadores não deixam abrir por código; cai no clique abaixo
            }
        }
        seletor.focus();
        seletor.click();
    };

    return (
        <div className="input-group" style={{ position: "relative", ...style }}>
            <input
                type="text"
                inputMode="numeric"
                id={id}
                name={name}
                className={className}
                placeholder="dd/mm/aaaa"
                value={texto}
                onChange={digitar}
                onBlur={() => setTexto(isoParaBR(value))}
                maxLength={10}
                required={required}
                disabled={disabled}
                autoComplete="off"
            />
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={abrirCalendario}
                disabled={disabled}
                title="Abrir calendário"
                aria-label="Abrir calendário"
            >
                <FaRegCalendarAlt />
            </button>
            {/* só abre o calendário do navegador; o valor aparece no campo de texto acima */}
            <input
                ref={seletorRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                value={value || ""}
                min={min}
                max={max}
                disabled={disabled}
                onChange={(e) => emitir(e.target.value)}
                style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: 0,
                    padding: 0,
                    border: 0,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
};

export default CampoData;
