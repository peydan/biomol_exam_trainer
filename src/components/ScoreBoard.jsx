import React from 'react';


export default function ScoreBoard({ score, total, onHome }) {
  const percentage = Math.round((score / total) * 100);
  
  let resultMessage = "עבודה טובה!";
  let resultColor = "var(--success)";
  if (percentage < 60) {
    resultMessage = "כדאי לתרגל שוב כדי להשתפר.";
    resultColor = "var(--error)";
  } else if (percentage >= 90) {
    resultMessage = "מצוין! תוצאה מדהימה!";
  }

  return (
    <div className="fade-in glass-panel" style={{ width: '100%', textAlign: 'center' }}>
      <h2>סיום המבחן!</h2>
      
      <div style={{ margin: '2rem 0' }}>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: resultColor }}>
          {percentage}%
        </div>
        <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
          ענית נכונה על {score} מתוך {total} שאלות.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {resultMessage}
        </p>
      </div>
      
      <button className="glass-button primary w-full" onClick={onHome}>
        חזור לדף הראשי
      </button>
    </div>
  );
}
