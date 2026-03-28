import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Comparison from './pages/Comparison.tsx';
import Education from './pages/Education.tsx';
import Migrate from './pages/Migrate.tsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/education" element={<Education />} />
        <Route path="/migrate" element={<Migrate />} />
      </Route>
    </Routes>
  );
}
