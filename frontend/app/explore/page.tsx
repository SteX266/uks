export default function ExplorePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Explore Repositories</h1>
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search repositories..."
          className="flex-1 border p-2 rounded-l-md"
        />
        <button className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700">
          Search
        </button>
      </div>
      <ul className="space-y-4">
        <li className="border p-4 rounded-md shadow-sm">Repository 1</li>
        <li className="border p-4 rounded-md shadow-sm">Repository 2</li>
        <li className="border p-4 rounded-md shadow-sm">Repository 3</li>
      </ul>
    </main>
  );
}
