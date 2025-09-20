export default function RepositoriesPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Repositories</h1>
      <button className="mb-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
        + New Repository
      </button>
      <ul className="space-y-4">
        <li className="border p-4 rounded-md shadow-sm">Repo A</li>
        <li className="border p-4 rounded-md shadow-sm">Repo B</li>
      </ul>
    </main>
  );
}
