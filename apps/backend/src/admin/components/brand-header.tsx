import React from "react"
import { Heading, Text, Badge } from "@medusajs/ui"

interface BrandHeaderProps {
  title: string
  subtitle?: string
  badgeText?: string
  children?: React.ReactNode
}

export const FriggaFrioLogoIcon = ({ className = "h-7 w-7" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="40" height="40" rx="8" fill="#0F2240" />
    {/* Snowflake / Cooling Core Symbol */}
    <path
      d="M20 7V33M7 20H33"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 11L29 29M29 11L11 29"
      stroke="#93C5FD"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
    <path
      d="M20 12L17 15M20 12L23 15"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M20 28L17 25M20 28L23 25"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 20L15 17M12 20L15 23"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M28 20L25 17M28 20L25 23"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title,
  subtitle,
  badgeText = "Operações FriggaFrio",
  children,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ui-border-base pb-4 sm:pb-5 mb-4 sm:mb-6 min-w-0 w-full">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <FriggaFrioLogoIcon className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 shadow-sm rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider text-[10px] sm:text-xs">
              FriggaFrio — Gestão Administrativa
            </Text>
            {badgeText && (
              <Badge size="2xsmall" color="blue" className="shrink-0 text-[10px] sm:text-xs">
                {badgeText}
              </Badge>
            )}
          </div>
          <Heading level="h1" className="text-ui-fg-base mt-0.5 sm:mt-1 font-semibold text-lg sm:text-2xl break-words">
            {title}
          </Heading>
          {subtitle && (
            <Text size="small" className="text-ui-fg-subtle mt-0.5 break-words text-xs sm:text-sm">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}
