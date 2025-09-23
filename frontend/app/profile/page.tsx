export default function ProfilePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Profile</h1>
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <p>
          <strong>Username:</strong> johndoe
        </p>
        <p>
          <strong>Email:</strong> johndoe@example.com
        </p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Edit Profile
        </button>
      </div>
    </main>
  );
}
