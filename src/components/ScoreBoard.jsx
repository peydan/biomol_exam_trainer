import React, { useState } from 'react';
import { renderGreekLetters } from '../utils/testUtils';

export default function ScoreBoard({ score, total, reviewData, onHome }) {
  const percentage = Math.round((score / total) * 100);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
  let resultMessage = "עבודה טובה!";
  let resultColor = "var(--success)";
  if (percentage < 60) {
    resultMessage = "כדאי לתרגל שוב כדי להשתפר.";
    resultColor = "var(--error)";
  } else if (percentage >= 90) {
    resultMessage = "מצוין! תוצאה מדהימה!";
  }

  const toggleQuestion = (idx) => {
    setExpandedQuestion(expandedQuestion === idx ? null : idx);
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <div className="glass-panel mb-4" style={{ textAlign: 'center' }}>
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

      {reviewData && reviewData.questions && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>סקירת שאלות</h3>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            לחץ על שאלה כדי לראות את התשובות שלך ואת התשובה הנכונה
          </p>
          
          <div className="flex-col gap-3">
            {reviewData.questions.map((q, idx) => {
              const selectedIdx = reviewData.finalizedAnswers[idx];
              const isAnswered = selectedIdx !== undefined;
              const isCorrect = isAnswered && q.scrambledOptions[selectedIdx]?.isCorrect;
              const correctOption = q.scrambledOptions.find(opt => opt.isCorrect);
              
              return (
                <div 
                  key={idx} 
                  className="review-question-item glass-panel" 
                  style={{ 
                    padding: '1rem', 
                    cursor: 'pointer',
                    border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                    opacity: isAnswered ? 1 : 0.7
                  }}
                  onClick={() => toggleQuestion(idx)}
                >
                  <div className="flex justify-between items-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isCorrect ? 'var(--success)' : 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontWeight: 'bold' }}>
                        {renderGreekLetters(q.question.split('\n')[0])}
                        {q.question.split('\n').length > 1 ? '...' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                      {expandedQuestion === idx ? '▲' : '▼'}
                    </div>
                  </div>
                  
                  {expandedQuestion === idx && (
                    <div className="fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                          {renderGreekLetters(q.question)}
                        </p>
                        {q.image && (
                          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <img 
                              src={`${import.meta.env.BASE_URL}tests/${reviewData.testId || 'exam-2023-a'}/${q.image}`} 
                              alt="שאלה" 
                              style={{ maxWidth: '100%', borderRadius: '8px' }} 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="options-grid" style={{ marginTop: '1rem' }}>
                        {q.scrambledOptions.map((opt, optIdx) => {
                          let optionClass = 'review-option';
                          let optionStyle = {};
                          
                          if (opt.isCorrect) {
                            optionClass += ' review-correct';
                            optionStyle = { borderColor: 'var(--success)', background: 'rgba(16, 185, 129, 0.15)' };
                          }
                          
                          if (isAnswered && selectedIdx === optIdx) {
                            optionClass += ' review-user-answer';
                            if (!opt.isCorrect) {
                              optionStyle = { borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.15)' };
                            }
                          }
                          
                          return (
                            <div 
                              key={optIdx} 
                              className={optionClass}
                              style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.03)',
                                ...optionStyle
                              }}
                            >
                              {renderGreekLetters(opt.text)}
                              {opt.isCorrect && <span style={{ marginInlineStart: '0.5rem', color: 'var(--success)' }}>✓</span>}
                              {isAnswered && selectedIdx === optIdx && !opt.isCorrect && (
                                <span style={{ marginInlineStart: '0.5rem', color: 'var(--error)' }}>✗</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                          <strong>התשובה שלך:</strong> {isAnswered ? renderGreekLetters(q.scrambledOptions[selectedIdx]?.text) : 'לא ענית'}
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                          <strong>התשובה הנכונה:</strong> {correctOption ? renderGreekLetters(correctOption.text) : 'לא ידוע'}
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                          <strong>מצב:</strong> {isCorrect ? 'נכון ✓' : 'לא נכון ✗'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
