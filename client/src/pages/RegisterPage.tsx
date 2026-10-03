import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Wallet } from "lucide-react";
import { PasswordVisibilityButton } from "../components/auth/PasswordVisibilityButton";
import { authInputClass, registerSchema } from "../lib/authSchemas";
import { authApi } from "../api/auth.api";
import { ApiClientError } from "../api/client";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

export function RegisterPage() {
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
      await authApi.register(values);
      navigate("/login", { replace: true, state: { registered: true } });
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
                Full name <span className="text-rose-300" aria-hidden="true">*</span>
                <span className="sr-only"> required</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                disabled={isSubmitting}
                className={authInputClass(Boolean(errors.name))}
                placeholder="e.g Nirjala Tuladhar"
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
                placeholder="e.g nirjala123@gmail.com"
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
                Password <span className="text-rose-300" aria-hidden="true">*</span>
                <span className="sr-only"> required</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  disabled={isSubmitting}
                  className={`${authInputClass(Boolean(errors.password))} pr-12`}
                  placeholder="e.g nirjala123"
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
              replace
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
