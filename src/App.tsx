export default function App() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl mb-4">Chicago Affordable Housing Developer</h1>
      <div className="flex gap-2 flex-wrap">
        <div className="px-3 py-2 rounded bg-accent text-white">accent</div>
        <div className="px-3 py-2 rounded bg-debt text-white">debt</div>
        <div className="px-3 py-2 rounded bg-equity text-white">equity</div>
        <div className="px-3 py-2 rounded bg-gap text-white">gap</div>
        <div className="px-3 py-2 rounded bg-caution text-white">caution</div>
      </div>
    </div>
  );
}
