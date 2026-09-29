import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LoaderCircle, Wallet } from "lucide-react";
import { authApi } from "../api/auth.api";
import { ApiClientError } from "../api/client";
import { setCredentials } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await authApi.register(values);
      dispatch(setCredentials(response.data));
      navigate("/dashboard", { replace: true });
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

      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-[#0c3b46]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Tourism Digital Wallet
              </p>
              <p className="text-sm text-teal-100/70">Create your account</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit} noValidate>
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
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-teal-50"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-white outline-none transition placeholder:text-teal-100/40 focus:border-teal-300/60 focus:ring-2 focus:ring-teal-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Alex Traveler"
                {...register("name")}
              />
              {errors.name ? (
                <p id="name-error" className="mt-2 text-sm text-rose-200" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-teal-50"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-white outline-none transition placeholder:text-teal-100/40 focus:border-teal-300/60 focus:ring-2 focus:ring-teal-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email ? (
                <p id="email-error" className="mt-2 text-sm text-rose-200" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-teal-50"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 pr-12 text-white outline-none transition placeholder:text-teal-100/40 focus:border-teal-300/60 focus:ring-2 focus:ring-teal-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="At least 8 characters"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-teal-100/80 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-teal-300/50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-teal-100/75">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-teal-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
