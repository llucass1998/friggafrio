import { forwardRef } from "react"
import { clsx } from "clsx"

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="radio"
            ref={ref}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={clsx(
              "w-5 h-5 rounded-full border border-[#E5EDF4] flex items-center justify-center transition-all duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[var(--color-primary)] hover:border-[#CBD9E6]",
              checked && "border-[var(--color-primary)] bg-[var(--color-primary)]",
              className
            )}
          >
            <div
              className={clsx(
                "w-2 h-2 bg-white rounded-full transition-transform duration-[var(--motion-duration-fast)]",
                checked ? "scale-100" : "scale-0"
              )}
            />
          </div>
        </label>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="text-[var(--color-text)] text-sm font-medium cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Radio.displayName = "Radio"

export default Radio
