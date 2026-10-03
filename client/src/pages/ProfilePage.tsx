import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fullNameSchema, passwordSchema } from "../lib/authSchemas";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, LogOut } from "lucide-react";
import { authApi } from "../api/auth.api";
import { ApiClientError } from "../api/client";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useChangePassword, useProfile, useUpdateProfile } from "../hooks/useProfile";
import { formatTripDate } from "../lib/date";
import { clearCredentials } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const nameSchema = z.object({
  name: fullNameSchema,
});

const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password",
  });

type NameValues = z.infer<typeof nameSchema>;
type PasswordValues = z.infer<typeof profilePasswordSchema>;

export function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const pushToast = useToast();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [editing, setEditing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    values: { name: profile.data?.name ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

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

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="space-y-3">
        <FeedbackBanner
          tone="error"
          message={
            profile.error instanceof ApiClientError
              ? profile.error.message
              : "Unable to load your profile."
          }
        />
        <button
          type="button"
          onClick={() => profile.refetch()}
          className="text-sm font-medium text-brand hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const user = profile.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-[#062a33]">
          <div
            aria-hidden="true"
            className="h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.45),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(14,116,144,0.65),_transparent_50%)]"
          />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="rounded-full bg-white p-1 shadow-sm">
                <UserAvatar name={user.name} size="lg" />
              </span>
              <div className="pb-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setNameError(null);
                nameForm.reset({ name: user.name });
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Edit profile
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Your avatar uses your initials. Profile photos are not stored separately from trip documents.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Account</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Member since</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {user.createdAt ? formatTripDate(user.createdAt) : "Not available"}
            </dd>
          </div>
        </dl>

        {editing ? (
          <form
            className="mt-6 space-y-3 border-t border-slate-100 pt-5"
            onSubmit={nameForm.handleSubmit(async (values) => {
              setNameError(null);
              try {
                await updateProfile.mutateAsync(values.name);
                setEditing(false);
                pushToast("Profile updated.");
              } catch (error) {
                setNameError(
                  error instanceof ApiClientError ? error.message : "Unable to update your name.",
                );
              }
            })}
            noValidate
          >
            {nameError ? <FeedbackBanner tone="error" message={nameError} /> : null}
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="profile-name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              {...nameForm.register("name")}
            />
            {nameForm.formState.errors.name ? (
              <p className="text-sm text-rose-600">{nameForm.formState.errors.name.message}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
              >
                {updateProfile.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Save name
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Change password</h3>
        <form
          className="mt-4 space-y-3"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            setPasswordError(null);
            try {
              await changePassword.mutateAsync(values);
              passwordForm.reset();
              pushToast("Password updated.");
            } catch (error) {
              setPasswordError(
                error instanceof ApiClientError ? error.message : "Unable to change your password.",
              );
            }
          })}
          noValidate
        >
          {passwordError ? <FeedbackBanner tone="error" message={passwordError} /> : null}
          <div>
            <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              {...passwordForm.register("currentPassword")}
            />
            {passwordForm.formState.errors.currentPassword ? (
              <p className="mt-1 text-sm text-rose-600">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              {...passwordForm.register("newPassword")}
            />
            {passwordForm.formState.errors.newPassword ? (
              <p className="mt-1 text-sm text-rose-600">{passwordForm.formState.errors.newPassword.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
          >
            {changePassword.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Update password
          </button>
        </form>
      </section>

      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}
