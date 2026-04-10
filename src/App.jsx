import { useState, useEffect } from 'react'
import './index.css'
import TestSelection from './components/TestSelection'
import PracticeSession from './components/PracticeSession'

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'practice'
  const [selectedTest, setSelectedTest] = useState(null);

  const startTest = (testMetadata, attemptId = null) => {
    setSelectedTest({ ...testMetadata, attemptId });
    setCurrentView('practice');
  };

  const endTest = () => {
    setSelectedTest(null);
    setCurrentView('home');
  };

  return (
    <>
      {currentView === 'home' && <TestSelection onStartTest={startTest} />}
      {currentView === 'practice' && selectedTest && (
        <PracticeSession test={selectedTest} onFinish={endTest} />
      )}
    </>
  )
}

export default App
