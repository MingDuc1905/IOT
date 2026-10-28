import { SettingsForm } from './SettingsForm.jsx';
import { SimulationPanel } from './SimulationPanel.jsx';

export function SettingsPage({ settings, onUpdateSettings, simActive, currentScenario }) {
  return (
    <div className="row row-deck row-cards">
      <div className="col-lg-7">
        <SettingsForm settings={settings} onUpdateSettings={onUpdateSettings} />
      </div>
      <div className="col-lg-5">
        <SimulationPanel simActive={simActive} currentScenario={currentScenario} />
      </div>
    </div>
  );
}
