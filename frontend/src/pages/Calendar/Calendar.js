import React, { useState , useEffect }   from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css"; 
import { FaArrowRight } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";


const CalendarPage = () => {
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [diasEscalados, setDiasEscalados] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  useEffect(() => {
    if (!user) return;

      const fetchEscalasMes = async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/escalaMes/?mes=${currentMonth + 1}&ano=${currentYear}&cpf=${user.cpf}`
          );

          const data = await res.json();
          console.log("RESPOSTA API:", data);
          setDiasEscalados(data);
        } catch (err) {
          console.error("Erro ao buscar escalas do mês:", err);
        }
      };

      fetchEscalasMes();
    }, [currentMonth, currentYear]);

    const isDiaEscalado = (day) => {
  if (!day) return false;

    const dataFormatada = `${day.toString().padStart(2, "0")}-${(currentMonth + 1)
      .toString()
      .padStart(2, "0")}-${currentYear}`;

    return diasEscalados.some(
      (d) => d.data === dataFormatada && d.escalado
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="PassButton" onClick={prevMonth}><FaArrowLeft />
        </button>
        <h2>
        {new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} {currentYear}
        </h2>
        <button className="PassButton" onClick={nextMonth}><FaArrowRight />
        </button>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day.toString().padStart(2, '0')} className="calendar-day-name">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => 
              day.toString().padStart(2, '0') && navigate(`/EscalaDoDia/${day.toString().padStart(2, '0')}-${(currentMonth + 1).toString().padStart(2, '0')}-${currentYear}`)
          }
                      className={`calendar-day ${

              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear()
                ? "calendar-today"
                : ""
              }${isDiaEscalado(day) ? " calendar-escalado" : ""}`}
              ><b>
            {day || ""}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;

