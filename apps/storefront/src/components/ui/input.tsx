import { clsx } from "clsx"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={clsx(
        "appearance-none shadow-sm outline-none focus:outline-none",
        "border border-[#E5EDF4] hover:border-[#CBD9E6]",
        "rounded-[var(--radius-input)]",
        "text-base font-medium text-[var(--color-text)]",
        "px-4 py-2.5 w-full",
        "bg-white",
        "placeholder:text-[var(--color-text-muted)]",
        "focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]",
        "motion-interactive",
        className
      )}
      {...props}
    />
  )
}
