import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';

const QuestionDataContext = createContext(null);

async function fetchProtectedJson(path, token) {
  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || '資料載入失敗。';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export function QuestionDataProvider({ children }) {
  const { session } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [importReport, setImportReport] = useState([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    supabase.auth.getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        if (!token) throw new Error('登入狀態已失效，請重新登入。');
        return Promise.all([
          fetchProtectedJson('/.netlify/functions/questions', token),
          fetchProtectedJson('/.netlify/functions/import-report', token),
        ]);
      })
      .then(([questionRows, reportRows]) => {
        if (controller.signal.aborted) return;
        setQuestions(Array.isArray(questionRows) ? questionRows : []);
        setImportReport(Array.isArray(reportRows) ? reportRows : []);
      })
      .catch((nextError) => {
        if (controller.signal.aborted) return;
        setQuestions([]);
        setImportReport([]);
        setError(nextError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [session?.access_token]);

  const value = useMemo(
    () => ({
      error,
      importReport,
      loading,
      questions,
    }),
    [error, importReport, loading, questions],
  );

  return <QuestionDataContext.Provider value={value}>{children}</QuestionDataContext.Provider>;
}

export function useQuestionData() {
  const context = useContext(QuestionDataContext);
  if (!context) throw new Error('useQuestionData must be used within QuestionDataProvider');
  return context;
}
