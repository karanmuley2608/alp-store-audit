export default function ReadonlyDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-page-title text-gray-900">Read-Only Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your role does not have a dedicated dashboard. Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
