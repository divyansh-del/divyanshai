export default function ModelPreferences(){
  return (
    <section className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-2">Model preferences</h3>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="radio" name="model" defaultChecked /> GPT-4o
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="model" /> Gemini Pro
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="model" /> Custom
        </label>
      </div>
    </section>
  );
}
