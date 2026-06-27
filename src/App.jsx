import { useLicense } from './hooks/useLicense';
import LicenseGate from './components/LicenseGate';
import MealApp from './MealApp';

export default function App() {
  const license = useLicense();

  if (license.loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#FAF7F2' }}>
        <div className="text-xl" style={{ color: '#2D9F93', fontFamily: 'system-ui' }}>
          Laden...
        </div>
      </div>
    );
  }

  if (!license.licensed) {
    return <LicenseGate activate={license.activate} />;
  }

  return <MealApp />;
}
