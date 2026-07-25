import { Check } from "@medusajs/icons"
import { clsx } from "clsx"
import { forwardRef } from "react"

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onChange, checked, ...props }, ref) => {
    const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
    }

    return (
      <div className="relative inline-block w-5 h-5 group">
        <input
          ref={ref}
          type="checkbox"
          className={clsx(
            "appearance-none shadow-none outline-none focus:outline-none",
            "border border-[#E5EDF4] group-hover:border-[#CBD9E6]",
            "rounded-[4px]",
            "text-base font-medium text-zinc-900",
            "w-full h-full",
            "bg-white",
            "checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)]",
            "absolute top-0 left-0 z-10 motion-interactive cursor-pointer",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]",
            className
          )}
          checked={checked}
          onChange={handleCheck}
          {...props}
        />
        <span
          className={clsx(
            "absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none",
            "z-20 text-white transition-all duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] scale-75",
            {
              "opacity-0 scale-50": !checked,
              "opacity-100 scale-100": checked,
            }
          )}
        >
          <Check className="w-3.5 h-3.5" />
        </span>
      </div>
    )
  }
)
