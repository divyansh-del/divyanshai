export default function CustomInstructions(){
  return (
    <section className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-2">Custom instructions</h3>
      <textarea className="w-full border rounded-md p-2" rows={4} placeholder="How should the assistant respond?"></textarea>
    </section>
  );
}
