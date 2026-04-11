import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import './index.css'
import TestSelection from './components/TestSelection'
import PracticeSession from './components/PracticeSession'

function HomePage() {
  const navigate = useNavigate();
  
  const startTest = (testMetadata, attemptId = null) => {
    if (attemptId) {
      navigate(`/test/${testMetadata.id}/${attemptId}`);
    } else {
      navigate(`/test/${testMetadata.id}`);
    }
  };

  return <TestSelection onStartTest={startTest} />;
}

function TestPage() {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  
  const testMetadata = {
    id: testId,
    attemptId: attemptId || null,
    title: testId ? `מבחן ${testId}` : 'מבחן',
    description: 'טוען...'
  };

  const endTest = () => {
    navigate('/');
  };

  return <PracticeSession test={testMetadata} onFinish={endTest} />;
}

function App() {
  return (
    <BrowserRouter basename="/biomol_exam_trainer">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test/:testId" element={<TestPage />} />
        <Route path="/test/:testId/:attemptId" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
