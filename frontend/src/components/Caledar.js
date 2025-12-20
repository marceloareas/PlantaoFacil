import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css"; 
import { FaArrowRight } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import EscalaDoDia from "../pages/EscalaDoDia/EscalaDoDia";

const CalendarPage = () => {
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

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
              day.toString().padStart(2, '0') && navigate(`/escalaDoDia/${day.toString().padStart(2, '0')}-${currentMonth + 1}-${currentYear}`)
          }
                      className={`calendar-day ${

              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear()
                ? "calendar-today"
                : ""
              }`}
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

