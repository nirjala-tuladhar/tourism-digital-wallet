import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold">Page Not Found</h2>

      <p className="mt-2 text-gray-600">
        The page you are looking for does not exist.
      </p>

      <Link
        to="/dashboard"
        className="mt-6 text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
