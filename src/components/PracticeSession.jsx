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
          q.options.map((text) => ({ 
            text, 
            isCorrect: text === q.correctAnswer 
          }))
        );
        return { ...q, scrambledOptions };
      });
    };

    fetch(`${import.meta.env.BASE_URL}tests/${test.id}/questions.json`)
      .then(res => res.json())
      .then(data => {
        const dataArray = Array.isArray(data) ? data : Object.values(data);
        setQuestions(processData(dataArray));
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
    setFinalizedAnswers(prev => ({ ...prev, [currentIndex]: userSelections[currentIndex] }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    }
  };

  const calculateFinalScore = () => {
    let scoreCount = 0;
    Object.entries(finalizedAnswers).forEach(([qIdxStr, selectedIdx]) => {
      const qIdx = parseInt(qIdxStr);
      if (questions[qIdx] && questions[qIdx].scrambledOptions[selectedIdx]?.isCorrect) {
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
    return <ScoreBoard 
      score={calculateFinalScore()} 
      total={questions.length} 
      reviewData={{ questions, finalizedAnswers, testId: test.id }}
      onHome={onFinish} 
    />;
  }

  const currentQ = questions[currentIndex];
  const currentSelection = userSelections[currentIndex];
  const isCurrentFinalized = finalizedAnswers[currentIndex];

  const allAnswered = Object.keys(finalizedAnswers).length === questions.length;

  if (showConfirm) {
    return (
      <div className="fade-in glass-panel confirm-dialog">
        <h2 className="confirm-title">האם אתה בטוח שברצונך לסיים את המבחן?</h2>
        <p className="confirm-text">
          ענית על {Object.keys(finalizedAnswers).length} מתוך {questions.length} שאלות.
        </p>
        <div className="flex gap-4 confirm-buttons">
          <button className="glass-button primary confirm-button" onClick={handleConfirmFinish}>
            כן, סיים
          </button>
          <button className="glass-button confirm-button" onClick={() => setShowConfirm(false)}>
            חזור למבחן
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in w-full flex-col" style={{ height: '100%' }}>
      <div className="flex justify-between items-center mb-4 text-secondary">
        <button className="glass-button top-bar-button" onClick={onFinish}>
          יציאה והשהייה
        </button>
        <button 
          className={`glass-button top-bar-button ${allAnswered ? 'success' : ''}`}
          onClick={handleFinishTest}
        >
          סיים מבחן
        </button>
      </div>

      <div className="glass-panel mb-4 fade-in" key={`q-${currentIndex}`}>
        <h2 className="whitespace-pre-wrap">{renderGreekLetters(currentQ.question)}</h2>
        {currentQ.image && (
          <div className="question-image-container">
            <img 
              src={`${import.meta.env.BASE_URL}tests/${test.id}/${currentQ.image}`} 
              alt="שאלה" 
              className="question-image"
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

      <div className="flex justify-center mt-6">
        {!isCurrentFinalized ? (
          <button 
            onClick={handleSubmit}
            disabled={currentSelection === undefined}
            className={`glass-button primary w-full ${currentSelection === undefined ? 'action-button-disabled' : ''}`}
          >
            אישור
          </button>
        ) : (
          <button 
            className={`glass-button w-full ${currentIndex < questions.length - 1 ? 'next-button-active' : 'next-button-inactive'}`}
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
          >
            {currentIndex < questions.length - 1 ? 'השאלה הבאה' : 'הגעת לשאלה האחרונה'}
          </button>
        )}
      </div>

      {/* Question Map Section at the bottom */}
      <div className="flex justify-center map-toggle-container">
        <button 
          className="glass-button w-full" 
          onClick={() => setIsMapOpen(!isMapOpen)}
        >
          {isMapOpen ? 'הסתר מפת שאלות' : 'הצג מפת שאלות'}
        </button>
      </div>

      {isMapOpen && (
        <div className="question-map-container glass-panel fade-in map-container" ref={mapRef}>
          {questions.map((_, idx) => {
            const selectedIdx = finalizedAnswers[idx];
            const isAnswered = selectedIdx !== undefined;
            let statusClass = '';
            
            if (isAnswered) {
               const isCorrect = questions[idx].scrambledOptions[selectedIdx].isCorrect;
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
