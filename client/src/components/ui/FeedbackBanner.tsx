type FeedbackBannerProps = {
  tone?: "error" | "success" | "info";
  message: string;
};

export function FeedbackBanner({
  tone = "info",
  message,
}: FeedbackBannerProps) {
  const styles =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div role="alert" className={`rounded-xl border px-3 py-2 text-sm ${styles}`}>
      {message}
    </div>
  );
}
