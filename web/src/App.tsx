import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ScanResults } from './pages/ScanResults';
import { Leaderboard } from './pages/Leaderboard';
import { Docs } from './pages/Docs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scans/:id" element={<ScanResults />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/docs" element={<Docs />} />
      </Route>
    </Routes>
  );
}
