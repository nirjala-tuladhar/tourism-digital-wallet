type UserAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#062a33] to-[#14b8a6] font-semibold text-white shadow-sm ${sizeClass[size]}`}
      aria-hidden="true"
    >
      {initialsFor(name)}
    </span>
  );
}
