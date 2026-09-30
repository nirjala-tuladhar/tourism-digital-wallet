import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.api";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { clearCredentials } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch {
      // Clear local auth even if the network request fails.
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-xl font-semibold">Tourism Digital Wallet</h1>

      <div className="flex items-center gap-4">
        {user ? <NotificationMenu /> : null}

        {user ? (
          <span className="hidden text-sm text-gray-600 sm:inline">
            {user.name}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
