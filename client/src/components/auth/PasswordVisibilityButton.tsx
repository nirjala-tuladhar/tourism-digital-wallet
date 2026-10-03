type PasswordVisibilityButtonProps = {
  visible: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function PasswordVisibilityButton({
  visible,
  disabled = false,
  onToggle,
}: PasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-teal-100 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-teal-300/50"
      aria-label={visible ? "Hide password" : "Show password"}
      disabled={disabled}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9.3 3.1 11 7-0.6 1.4-1.5 2.7-2.6 3.8" strokeLinecap="round" />
          <path d="M6.1 6.1C4.2 7.4 2.7 9.1 1.8 12c1.7 3.9 6 7 10.2 7 1.5 0 2.9-.3 4.2-.9" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
