import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { AddExpensePage } from './pages/AddExpensePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function AppRoutes() {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<ExpensesPage />} />
        <Route path="/expenses/new" element={<AddExpensePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PageLayout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
