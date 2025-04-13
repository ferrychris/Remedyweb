import { Routes, Route } from 'react-router-dom';
import { Overview } from './Overview';
import HealthMetrics from './HealthMetrics';
import SavedRemedies from './SavedRemedies';
import { Settings } from './Settings';
import { Orders } from './Orders';
import { Consultations } from './Consultations';

export function UserDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="health-metrics" element={<HealthMetrics />} />
      <Route path="saved-remedies" element={<SavedRemedies />} />
      <Route path="settings" element={<Settings />} />
      <Route path="orders" element={<Orders />} />
      <Route path="settings" element={<Settings />} />
      <Route path="consultations" element={<Consultations />} />
    </Routes>
  );
} 