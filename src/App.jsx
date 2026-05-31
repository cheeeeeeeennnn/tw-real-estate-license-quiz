import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import ChoicePracticePage from './pages/ChoicePracticePage.jsx';
import EssayPracticePage from './pages/EssayPracticePage.jsx';
import WrongBookPage from './pages/WrongBookPage.jsx';
import EssayAnswersPage from './pages/EssayAnswersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import QuestionBankPage from './pages/QuestionBankPage.jsx';
import LawLibraryPage from './pages/LawLibraryPage.jsx';
import StudyModePage from './pages/StudyModePage.jsx';
import LectureReviewPage from './pages/LectureReviewPage.jsx';
import LectureUnitListPage from './pages/LectureUnitListPage.jsx';
import LectureUnitPage from './pages/LectureUnitPage.jsx';
import StudySandboxPage from './pages/StudySandboxPage.jsx';
import AuthGate from './components/AuthGate.jsx';

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<StudyModePage />} />
        <Route path="/past-exams" element={<HomePage />} />
        <Route path="/lecture-review" element={<LectureReviewPage />} />
        <Route path="/lecture-review/:lectureSubjectSlug" element={<LectureUnitListPage />} />
        <Route path="/lecture-review/:lectureSubjectSlug/:unitId" element={<LectureUnitPage />} />
        <Route path="/study-sandbox" element={<StudySandboxPage />} />
        <Route path="/question-bank" element={<QuestionBankPage />} />
        <Route path="/subject/:subjectSlug" element={<SubjectPage />} />
        <Route path="/subject/:subjectSlug/choice" element={<ChoicePracticePage />} />
        <Route path="/subject/:subjectSlug/essay" element={<EssayPracticePage />} />
        <Route path="/subject/:subjectSlug/wrong-book" element={<WrongBookPage />} />
        <Route path="/subject/:subjectSlug/essay-answers" element={<EssayAnswersPage />} />
        <Route path="/subject/:subjectSlug/statistics" element={<StatisticsPage />} />
        <Route path="/subject/:subjectSlug/laws" element={<LawLibraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  );
}
