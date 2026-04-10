import React, { useState, useEffect } from 'react';
import { getHighScore, getAttempts, deleteAttempt } from '../utils/testUtils';

export default function TestSelection({ onStartTest }) {
  const [testsData, setTestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [refreshTs, setRefreshTs] = useState(Date.now());

  const toggleExpand = (id) => {
    setExpandedTestId(prev => prev === id ? null : id);
  };

  const handleDelete = (testId, index) => {
    deleteAttempt(testId, index);
    setRefreshTs(Date.now()); // Force re-render
  };

  useEffect(() => {
    fetch('/tests/registry.json')
      .then(res => res.json())
      .then(data => {
        setTestsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load tests config", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>טוען מבחנים...</div>;

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <h1>מערכת אימון מבחנים</h1>
      <p className="text-center mb-8">בחר מבחן כדי להתחיל לתרגל. בהצלחה!</p>
      
      <div className="flex-col gap-4">
        {testsData.map(test => {
          const allAttempts = getAttempts(test.id);
          const inProgressAttempts = allAttempts.map((a, i) => ({ ...a, originalIndex: i })).filter(a => a.status === 'in-progress');
          const finishedAttempts = allAttempts.map((a, i) => ({ ...a, originalIndex: i })).filter(a => a.status !== 'in-progress');
          
          const highScore = getHighScore(test.id);
          
          return (
            <div key={test.id} className={`glass-panel ${expandedTestId === test.id ? 'expanded' : ''}`} style={{ transition: 'all 0.3s ease' }}>
              <div style={{ cursor: 'pointer' }} onClick={() => toggleExpand(test.id)}>
                <h2>{test.title}</h2>
                <p className="mb-4">{test.description}</p>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      נסיונות שהושלמו: {finishedAttempts.length}
                    </span>
                    {finishedAttempts.length > 0 && (
                      <span style={{ marginInlineStart: '1rem', fontSize: '0.9rem', color: 'var(--success)' }}>
                        שיא: {Math.round(highScore * 100)}%
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                    {expandedTestId === test.id ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {/* Expanded History Section */}
              {expandedTestId === test.id && (
                <div className="fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>היסטוריית נסיונות</h3>
                  
                  {/* Active In-Progress Attempts */}
                  {inProgressAttempts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {inProgressAttempts.map((attempt) => {
                         const dateObj = new Date(attempt.date);
                         const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();
                         const dateString = isToday ? 'היום, ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateObj.toLocaleDateString();
                         const answeredCount = Object.keys(attempt.finalizedAnswers || {}).length;
                         const totalQ = attempt.questions ? attempt.questions.length : '?';
                         
                         return (
                           <div key={attempt.originalIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--primary-light)', borderRadius: '8px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               <button 
                                 title="מחק נסיון זה"
                                 onClick={(e) => { e.stopPropagation(); handleDelete(test.id, attempt.originalIndex); }}
                                 style={{ 
                                   background: 'transparent', border: 'none', color: 'var(--error)', 
                                   cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'
                                 }}
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <polyline points="3 6 5 6 21 6"></polyline>
                                   <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                 </svg>
                               </button>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>מבחן פתוח</span>
                                 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>הותחל ב: {dateString}</span>
                               </div>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                               <span style={{ color: 'var(--text-secondary)' }}>{answeredCount} / {totalQ} נענו</span>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); onStartTest(test, attempt.id); }} 
                                 className="glass-button primary" 
                                 style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }}
                               >
                                 המשך
                               </button>
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  )}

                  {finishedAttempts.length === 0 ? (
                    <p>עדיין לא הושלמו נסיונות במבחן זה.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      {finishedAttempts.map((attempt, idx) => {
                         const dateObj = new Date(attempt.date);
                         const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();
                         const dateString = isToday ? 'היום, ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateObj.toLocaleDateString();
                         const percentage = Math.round((attempt.correctCount / attempt.totalQuestions) * 100) || 0;
                         const isHigh = percentage >= 80;
                         const isLow = percentage < 60;
                         const color = isHigh ? 'var(--success)' : (isLow ? 'var(--error)' : 'var(--text-primary)');
                         
                         return (
                           <div key={attempt.originalIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               <button 
                                 title="מחק נסיון זה"
                                 onClick={(e) => { e.stopPropagation(); handleDelete(test.id, attempt.originalIndex); }}
                                 style={{ 
                                   background: 'transparent', border: 'none', color: 'var(--error)', 
                                   cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'
                                 }}
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <polyline points="3 6 5 6 21 6"></polyline>
                                   <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                 </svg>
                               </button>
                               <span>נסיון {idx + 1} ({dateString})</span>
                             </div>
                             <span style={{ color, fontWeight: 'bold' }}>{attempt.correctCount} / {attempt.totalQuestions} ({percentage}%)</span>
                           </div>
                         );
                      })}
                    </div>
                  )}
                  
                  <button 
                    className="glass-button w-full" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onStartTest(test); // doesn't pass attemptId, creates new
                    }}
                    style={{ marginTop: finishedAttempts.length === 0 ? '1rem' : '0' }}
                  >
                    התחל נסיון חדש מ-0
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
