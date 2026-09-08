import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { Search, X } from "lucide-react"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { sdk } from "@/lib/medusa"

export function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const generatedId = useId()
  const inputId = `header-search-${compact ? "compact" : "desktop"}-${generatedId.replace(/:/g, "")}`
  const listboxId = `${inputId}-suggestions`
  const [value, setValue] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedValue = value.trim()
  const suggestionsQuery = useQuery({
    queryKey: ["header-search-suggestions", normalizedValue],
    queryFn: async () => {
      const response = await sdk.store.product.list({
        q: normalizedValue,
        limit: 6,
        fields: "id,title,handle,thumbnail",
      })
      return response.products || []
    },
    enabled: normalizedValue.length >= 2 && isFocused,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
  const suggestions = suggestionsQuery.data || []
  const showSuggestions = isFocused && normalizedValue.length >= 2

  useEffect(() => {
    setActiveIndex(-1)
  }, [normalizedValue])

  const submitSuggestion = (handle: string) => {
    window.location.assign(`/${countryCode}/products/${encodeURIComponent(handle)}`)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, -1))
    } else if (event.key === "Escape") {
      event.preventDefault()
      setIsFocused(false)
      setActiveIndex(-1)
    } else if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      submitSuggestion(suggestions[activeIndex].handle)
    }
  }

  return (
    <div className={`relative flex flex-1 ${compact ? "max-w-md" : "max-w-2xl"}`}>
      <form action={`/${countryCode}/store`} className="flex w-full">
        <label htmlFor={inputId} className="sr-only">Buscar produtos</label>
        <input
          ref={inputRef}
          id={inputId}
          name="q"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          placeholder={compact ? "Buscar produtos..." : "Busque por produto, gás, marca ou código"}
          className={`w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] pl-4 pr-20 text-sm transition-[background-color,border-color,box-shadow] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${compact ? "min-h-11 py-2" : "py-2.5"}`}
          aria-label="Busque por produto, gás, marca ou código"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        />
        {value && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setValue("")
              inputRef.current?.focus()
            }}
            className="absolute right-10 top-0 h-full px-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-0 top-0 h-full rounded-r-md px-4 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
      {showSuggestions && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de produtos"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[90] overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-xl"
        >
          {suggestionsQuery.isPending ? (
            <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]" role="status">Buscando produtos...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((product, index) => (
              <button
                key={product.id}
                id={`${listboxId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitSuggestion(product.handle)}
                className={`block w-full px-4 py-3 text-left text-sm text-[var(--color-navy)] ${index === activeIndex ? "bg-[var(--color-surface-soft)]" : "hover:bg-[var(--color-surface-soft)]"}`}
              >
                {product.title}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">Nenhum produto encontrado.</p>
          )}
        </div>
      )}
    </div>
  )
}
