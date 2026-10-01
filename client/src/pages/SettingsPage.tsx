import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { authApi } from "../api/auth.api";
import { clearCredentials } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function SettingsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const logout = async () => {
    try {
      if (token) await authApi.logout(token);
    } catch {
      // Clear local auth even if the network request fails.
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Account actions for your wallet.</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Sign out</h3>
        <p className="mt-1 text-sm text-slate-500">
          End this session on this device.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#062a33] to-[#0e7490] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </section>
    </div>
  );
}
