import ModelPreferences from './ModelPreferences';
import DataControls from './DataControls';
import VoiceSettings from './VoiceSettings';
import LanguageSettings from './LanguageSettings';
import CustomInstructions from './CustomInstructions';
import WorkspaceSettings from './WorkspaceSettings';

export default function SettingsLayout(){
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="space-y-6">
        <ModelPreferences />
        <DataControls />
        <VoiceSettings />
        <LanguageSettings />
        <CustomInstructions />
        <WorkspaceSettings />
      </div>
    </div>
  );
}
