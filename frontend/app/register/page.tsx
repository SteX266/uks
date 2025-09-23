export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center">Register</h1>
        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="border p-2 rounded-md"
          />
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded-md"
          />
          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
          >
            Sign Up
          </button>
        </form>
      </div>
    </main>
  );
}
