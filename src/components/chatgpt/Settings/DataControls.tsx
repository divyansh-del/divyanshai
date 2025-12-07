export default function DataControls(){
  return (
    <section className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-2">Data Controls</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked /> Allow this app to store conversation history
          </label>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Share anonymized usage to improve models
          </label>
        </div>
      </div>
    </section>
  );
}
