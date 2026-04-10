import React, { useState, useEffect, useRef } from 'react';
import { shuffleArray, saveOrUpdateAttempt, renderGreekLetters } from '../utils/testUtils';
import ScoreBoard from './ScoreBoard';

export default function PracticeSession({ test, onFinish }) {
  const [attemptId, setAttemptId] = useState(test.attemptId || null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Object Maps replacing scalar values
  const [userSelections, setUserSelections] = useState({});
  const [finalizedAnswers, setFinalizedAnswers] = useState({});
  const [isMapOpen, setIsMapOpen] = useState(true);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Map scrolling reference
  const mapRef = useRef(null);

  useEffect(() => {
    if (test.attemptId) {
      const attempts = JSON.parse(localStorage.getItem(`examsapp_attempts_${test.id}`) || '[]');
      const attempt = attempts.find(a => a.id === test.attemptId);
      if (attempt) {
        setQuestions(attempt.questions || []);
        setCurrentIndex(attempt.currentIndex || 0);
        setUserSelections(attempt.userSelections || {});
        setFinalizedAnswers(attempt.finalizedAnswers || {});
        setLoading(false);
        return;
      }
    }
    
    const newId = Date.now().toString();
    setAttemptId(newId);

    const processData = (qData) => {
      return qData.map(q => {
        const scrambledOptions = shuffleArray(
          q.options.map((text, idx) => ({ text, isCorrect: idx === 0 }))
        );
        return { ...q, scrambledOptions };
      });
    };

    fetch(`/tests/${test.id}/questions.json`)
      .then(res => res.json())
      .then(data => {
        setQuestions(processData(data));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load test", err);
        setLoading(false);
      });
  }, [test.id, test.attemptId]);

  useEffect(() => {
    if (questions.length > 0 && !isFinished && attemptId) {
      saveOrUpdateAttempt(test.id, {
        id: attemptId,
        date: new Date().toISOString(),
        status: 'in-progress',
        questions,
        currentIndex,
        userSelections,
        finalizedAnswers
      });
    }
  }, [questions, currentIndex, userSelections, finalizedAnswers, test.id, isFinished, attemptId]);

  // Scroll active map button into view
  useEffect(() => {
    if (mapRef.current) {
      const activeBtn = mapRef.current.querySelector('.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const handleSelect = (optIndex) => {
    if (finalizedAnswers[currentIndex]) return;
    setUserSelections(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (userSelections[currentIndex] === undefined) return;
    setFinalizedAnswers(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    }
  };

  const calculateFinalScore = () => {
    let scoreCount = 0;
    Object.entries(userSelections).forEach(([qIdxStr, optIdx]) => {
      const qIdx = parseInt(qIdxStr);
      // Only count if it's actually finalized
      if (finalizedAnswers[qIdx] && questions[qIdx].scrambledOptions[optIdx].isCorrect) {
        scoreCount += 1;
      }
    });
    return scoreCount;
  };

  const handleConfirmFinish = () => {
    setShowConfirm(false);
    const finalScore = calculateFinalScore();
    
    saveOrUpdateAttempt(test.id, {
      id: attemptId,
      date: new Date().toISOString(),
      status: 'finished',
      score: finalScore,
      correctCount: finalScore,
      totalQuestions: questions.length
    });
    setIsFinished(true);
  };

  const handleFinishTest = () => {
    setShowConfirm(true);
  };

  if (loading) return <div>טוען מבחן...</div>;
  if (!loading && questions.length === 0) return <div>המבחן ריק או לא נמצא</div>;

  if (isFinished) {
    return <ScoreBoard score={calculateFinalScore()} total={questions.length} onHome={onFinish} />;
  }

  const currentQ = questions[currentIndex];
  const currentSelection = userSelections[currentIndex];
  const isCurrentFinalized = finalizedAnswers[currentIndex];

  const allAnswered = Object.keys(finalizedAnswers).length === questions.length;

  if (showConfirm) {
    return (
      <div className="fade-in glass-panel" style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>האם אתה בטוח שברצונך לסיים את המבחן?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          ענית על {Object.keys(finalizedAnswers).length} מתוך {questions.length} שאלות.
        </p>
        <div className="flex gap-4" style={{ justifyContent: 'center' }}>
          <button className="glass-button primary" onClick={handleConfirmFinish} style={{ width: '120px' }}>
            כן, סיים
          </button>
          <button className="glass-button" onClick={() => setShowConfirm(false)} style={{ width: '120px' }}>
            חזור למבחן
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-between items-center mb-4 text-secondary">
        <button className="glass-button" style={{ padding: '0.4rem 1rem' }} onClick={onFinish}>
          יציאה והשהייה
        </button>
        <button 
          className={`glass-button ${allAnswered ? 'success' : ''}`}
          style={{ padding: '0.4rem 1rem' }} 
          onClick={handleFinishTest}
        >
          סיים מבחן
        </button>
      </div>

      <div className="glass-panel mb-4 fade-in" key={`q-${currentIndex}`}>
        <h2 style={{ whiteSpace: 'pre-wrap' }}>{renderGreekLetters(currentQ.question)}</h2>
        {currentQ.image && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={`/tests/${test.id}/${currentQ.image}`} 
              alt="שאלה" 
              style={{ maxWidth: '100%', borderRadius: '8px' }} 
            />
          </div>
        )}
      </div>

      <div className={`fade-in ${currentQ.scrambledOptions.some(o => o.text.length > 5) ? 'flex-col' : 'options-grid'}`}>
        {currentQ.scrambledOptions.map((opt, idx) => {
          let extraClass = '';
          if (currentSelection === idx) extraClass = 'selected';
          
          if (isCurrentFinalized) {
             if (opt.isCorrect) extraClass = 'correct';
             else if (currentSelection === idx && !opt.isCorrect) extraClass = 'incorrect';
             else extraClass = ''; 
          }

          return (
            <div 
              key={idx} 
              className={`option-item ${extraClass} ${opt.text.length <= 5 ? 'short-item' : ''}`}
              onClick={() => handleSelect(idx)}
            >
              {renderGreekLetters(opt.text)}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center" style={{ marginTop: '2rem' }}>
        {!isCurrentFinalized ? (
          <button 
            className="glass-button primary w-full" 
            onClick={handleSubmit}
            disabled={currentSelection === undefined}
            style={{ opacity: currentSelection === undefined ? 0.5 : 1 }}
          >
            אישור
          </button>
        ) : (
          <button 
            className="glass-button w-full" 
            style={{ 
              background: currentIndex < questions.length - 1 ? 'var(--text-primary)' : 'var(--glass-bg)', 
              color: currentIndex < questions.length - 1 ? 'var(--secondary)' : 'var(--text-primary)',
              opacity: currentIndex === questions.length - 1 ? 0.5 : 1
            }}
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
          >
            {currentIndex < questions.length - 1 ? 'השאלה הבאה' : 'הגעת לשאלה האחרונה'}
          </button>
        )}
      </div>

      {/* Question Map Section at the bottom */}
      <div className="flex justify-center" style={{ marginTop: '2rem' }}>
        <button 
          className="glass-button w-full" 
          onClick={() => setIsMapOpen(!isMapOpen)}
        >
          {isMapOpen ? 'הסתר מפת שאלות' : 'הצג מפת שאלות'}
        </button>
      </div>

      {isMapOpen && (
        <div className="question-map-container glass-panel fade-in" ref={mapRef} style={{ padding: '1rem' }}>
          {questions.map((_, idx) => {
            const isAnswered = finalizedAnswers[idx];
            const selection = userSelections[idx];
            let statusClass = '';
            
            if (isAnswered && selection !== undefined) {
               const isCorrect = questions[idx].scrambledOptions[selection].isCorrect;
               statusClass = isCorrect ? 'answered-correct' : 'answered-incorrect';
            }

            return (
              <button 
                key={idx}
                className={`question-map-btn ${currentIndex === idx ? 'active' : ''} ${statusClass}`}
                onClick={() => { setCurrentIndex(idx); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
