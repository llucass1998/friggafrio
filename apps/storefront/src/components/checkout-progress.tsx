import { Button } from "@/components/ui/button"
import { CheckoutStep, CheckoutStepKey } from "@/lib/types/global"
import { clsx } from "clsx"

type CheckoutProgressProps = {
  steps: CheckoutStep[];
  currentStepIndex: number;
  handleStepChange: (step: CheckoutStepKey) => void;
  className?: string;
};

const CheckoutProgress = ({
  steps,
  currentStepIndex,
  handleStepChange,
  className,
}: CheckoutProgressProps) => {
  return (
    <nav aria-label="Etapas do checkout" className={clsx("rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm", className)}>
      <ol className="grid grid-cols-2 gap-1 sm:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.key} className="min-w-0">
          <Button
            onClick={() => handleStepChange(step.key)}
            variant={"ghost"}
            className={clsx(
              "h-auto w-full justify-start gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-semibold sm:px-4 sm:text-sm",
              index < currentStepIndex && "text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900",
              index > currentStepIndex && "text-zinc-400",
              index === currentStepIndex && "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white"
            )}
            disabled={index > currentStepIndex}
            aria-current={index === currentStepIndex ? "step" : undefined}
          >
            <span className={clsx(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
              index === currentStepIndex ? "bg-white/20" : index < currentStepIndex ? "bg-emerald-100" : "bg-zinc-100",
            )}>{index < currentStepIndex ? "✓" : index + 1}</span>
            <span className="truncate">{step.title}</span>
          </Button>
        </li>
      ))}
      </ol>
    </nav>
  )
}

export default CheckoutProgress
