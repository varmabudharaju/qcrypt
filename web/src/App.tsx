import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ScanResults } from './pages/ScanResults';
import { Benchmarks } from './pages/Benchmarks';
import { Migration } from './pages/Migration';
import { Compliance } from './pages/Compliance';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scans/:id" element={<ScanResults />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/migration" element={<Migration />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
