import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Wallet } from "lucide-react";
import { PasswordVisibilityButton } from "../components/auth/PasswordVisibilityButton";
import { authInputClass, loginSchema } from "../lib/authSchemas";
import { authApi } from "../api/auth.api";
import { ApiClientError } from "../api/client";
import { setCredentials } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const locationState = location.state as { reason?: string; registered?: boolean } | null;
  const expired = locationState?.reason === "expired";
  const [formError, setFormError] = useState<string | null>(
    expired ? "Your session has expired. Please sign in again." : null,
  );
  const [registeredNotice] = useState(Boolean(locationState?.registered));

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await authApi.login(values);
      dispatch(setCredentials(response.data));
      navigate(fromPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
        return;
      }

      setFormError("Something went wrong. Please try again.");
    }
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#062a33] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(14,116,144,0.35),_transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur">
              <Wallet className="h-5 w-5 text-teal-200" aria-hidden="true" />
              <span className="text-sm font-medium tracking-wide text-teal-50">
                Tourism Digital Wallet
              </span>
            </div>

            <h1 className="mt-8 max-w-xl font-serif text-5xl leading-tight text-white xl:text-6xl">
              Your travel essentials, one secure wallet
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-teal-50/80">
              Sign in to manage trips, documents, bookings, and itineraries in
              one place built for travelers.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-[#0c3b46]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Tourism Digital Wallet
                  </p>
                  <p className="text-sm text-teal-100/70">Welcome back</p>
                </div>
              </div>

              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                <p className="mt-2 text-sm text-teal-100/75">
                  Enter your credentials to continue to your wallet.
                </p>
              </div>

              <form className="space-y-5" onSubmit={onSubmit} noValidate>
                {registeredNotice ? (
                  <div
                    role="status"
                    className="rounded-lg border border-teal-200/30 bg-teal-400/10 px-3 py-2 text-sm text-teal-50"
                  >
                    Account created. Sign in to continue.
                  </div>
                ) : null}
                {formError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                  >
                    {formError}
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-teal-50"
                  >
                    Email <span className="text-rose-300" aria-hidden="true">*</span>
                    <span className="sr-only"> required</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isSubmitting}
                    className={authInputClass(Boolean(errors.email))}
                    placeholder="you@example.com"
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p
                      id="email-error"
                      className="mt-2 text-sm text-rose-200"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-teal-50"
                  >
                    Password <span className="text-rose-300" aria-hidden="true">*</span>
                    <span className="sr-only"> required</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                      disabled={isSubmitting}
                      className={`${authInputClass(Boolean(errors.password))} pr-12`}
                      placeholder="Enter your password"
                      {...register("password")}
                    />
                    <PasswordVisibilityButton
                      visible={showPassword}
                      disabled={isSubmitting}
                      onToggle={() => setShowPassword((current) => !current)}
                    />
                  </div>
                  {errors.password ? (
                    <p
                      id="password-error"
                      className="mt-2 text-sm text-rose-200"
                      role="alert"
                    >
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-[#04343f] transition hover:bg-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c3b46] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-teal-100/75">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-teal-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50"
                >
                  Create one
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
