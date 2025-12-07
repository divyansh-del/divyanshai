export default function VoiceSettings(){
  return (
    <section className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-2">Voice settings</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> Enable voice mode
        </label>
        <div className="text-sm text-gray-600">Microphone sensitivity and transcription options will appear here.</div>
      </div>
    </section>
  );
}
