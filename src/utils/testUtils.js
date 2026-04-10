// Replace latin greek letter names with actual unicode symbols
export function renderGreekLetters(text) {
  if (!text) return text;
  return text
    .replace(/\balpha\b/gi, 'α')
    .replace(/\bbeta\b/gi, 'β')
    .replace(/\bgamma\b/gi, 'γ')
    .replace(/\bdelta\b/gi, 'δ')
    .replace(/\bphi\b/gi, 'φ')
    .replace(/\bpsi\b/gi, 'ψ')
    .replace(/\bomega\b/gi, 'ω')
    .replace(/\bsigma\b/gi, 'σ')
    .replace(/\btheta\b/gi, 'θ')
    .replace(/\blambda\b/gi, 'λ')
    .replace(/\bmu\b/gi, 'μ');
}

// Utility to shuffle an array
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function saveOrUpdateAttempt(testId, attemptData) {
  const attempts = getAttempts(testId);
  const existingIdx = attempts.findIndex(a => a.id === attemptData.id);
  
  if (existingIdx >= 0) {
    attempts[existingIdx] = attemptData;
  } else {
    attempts.push(attemptData);
  }
  
  localStorage.setItem(`examsapp_attempts_${testId}`, JSON.stringify(attempts));
}

export function getAttempts(testId) {
  const stored = localStorage.getItem(`examsapp_attempts_${testId}`);
  return stored ? JSON.parse(stored) : [];
}

export function deleteAttempt(testId, index) {
  const attempts = getAttempts(testId);
  if (index >= 0 && index < attempts.length) {
    attempts.splice(index, 1);
    localStorage.setItem(`examsapp_attempts_${testId}`, JSON.stringify(attempts));
  }
}

export function getHighScore(testId) {
  const attempts = getAttempts(testId).filter(a => a.status !== 'in-progress');
  if (attempts.length === 0) return 0;
  return Math.max(...attempts.map(a => (a.correctCount || 0) / (a.totalQuestions || 1)));
}
