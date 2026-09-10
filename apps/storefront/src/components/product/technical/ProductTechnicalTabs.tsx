import { useRef } from "react"

export interface TechnicalTabSection {
  id: string
  label: string
}

interface ProductTechnicalTabsProps {
  sections: TechnicalTabSection[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  className?: string
}

export function ProductTechnicalTabs({
  sections,
  activeTabId,
  onSelectTab,
  className = "",
}: ProductTechnicalTabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const handleKeyDown = (event: React.KeyboardEvent, currentId: string) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
    event.preventDefault()

    const currentIndex = sections.findIndex((s) => s.id === currentId)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (event.key === "Home") nextIndex = 0
    else if (event.key === "End") nextIndex = sections.length - 1
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % sections.length
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + sections.length) % sections.length

    const nextSection = sections[nextIndex]
    if (nextSection) {
      onSelectTab(nextSection.id)
      tabRefs.current[nextSection.id]?.focus()
    }
  }

  return (
    <nav
      aria-label="Informações técnicas do produto"
      role="tablist"
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#d7e2ea] pb-2 ${className}`}
    >
      {sections.map((section) => {
        const isSelected = activeTabId === section.id
        return (
          <button
            key={section.id}
            ref={(node) => {
              tabRefs.current[section.id] = node
            }}
            type="button"
            role="tab"
            id={`product-tab-${section.id}`}
            aria-controls={`product-panel-${section.id}`}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelectTab(section.id)}
            onKeyDown={(e) => handleKeyDown(e, section.id)}
            className={`border-b-2 px-1 pb-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
              isSelected
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            }`}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}

export default ProductTechnicalTabs
