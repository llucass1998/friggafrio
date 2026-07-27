import { AccessibilityPreferences } from "@/components/accessibility/accessibility.types"
import React from "react"
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider"
import * as Dialog from "@radix-ui/react-dialog"
import * as Switch from "@radix-ui/react-switch"
import {
  X, Type, Palette, SunMoon, Link as LinkIcon,
  MoveHorizontal, Maximize2, Settings2, RotateCcw,
  Ear, AlignLeft, EyeOff
} from "lucide-react"
import { announceToScreenReader } from "@/components/accessibility/LiveRegion"

export function AccessibilityPanel() {
  const { preferences, updatePreference, resetPreferences, togglePanel } = useAccessibility()

  const handleFontScale = (direction: "up" | "down" | "reset") => {
    const scales = [1, 1.125, 1.25, 1.375, 1.5]
    const currentIndex = scales.indexOf(preferences.fontScale)
    let newIndex = currentIndex
    if (direction === "up" && currentIndex < scales.length - 1) newIndex++
    if (direction === "down" && currentIndex > 0) newIndex--
    if (direction === "reset") newIndex = 0
    updatePreference("fontScale", scales[newIndex])
    announceToScreenReader(`Tamanho do texto alterado para ${scales[newIndex] * 100}%`)
  }

  const handleContrast = (mode: "default" | "high" | "inverted") => {
    updatePreference("contrast", mode)
    announceToScreenReader(`Contraste alterado para ${mode}`)
  }

  const toggleBooleanPref = (key: keyof typeof preferences, label: string) => {
    const val = !preferences[key]
    updatePreference(key as keyof AccessibilityPreferences, val)
    announceToScreenReader(`${label} ${val ? "ativado" : "desativado"}`)
  }

  return (
    <Dialog.Root open={preferences.panelEnabled} onOpenChange={togglePanel}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[9990]" />
        <Dialog.Content
          id="a11y-panel-drawer"
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-[9999] flex flex-col border-l border-[var(--color-border)] overflow-hidden"
          aria-describedby="a11y-panel-description"
        >
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
            <div>
              <Dialog.Title className="text-xl font-bold text-[var(--color-navy)] m-0 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[var(--color-primary)]" />
                Recursos de Acessibilidade
              </Dialog.Title>
              <Dialog.Description id="a11y-panel-description" className="text-sm text-[var(--color-text-muted)] mt-1 mb-0">
                Personalize a visualizacao conforme suas necessidades.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-border)] text-[var(--color-navy)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] transition-colors"
                aria-label="Fechar painel de acessibilidade"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            <section aria-labelledby="a11y-text-size-title">
              <h3 id="a11y-text-size-title" className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" /> Tamanho do Texto
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFontScale("down")}
                  disabled={preferences.fontScale === 1}
                  className="flex-1 py-2.5 px-3 border border-[var(--color-border)] rounded-md font-medium text-[var(--color-navy)] hover:bg-[var(--color-surface-soft)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  aria-label="Diminuir tamanho do texto"
                >A-</button>
                <div className="px-4 py-2 bg-[var(--color-surface-soft)] font-mono text-sm rounded-md font-medium min-w-[70px] text-center" aria-live="polite">
                  {preferences.fontScale * 100}%
                </div>
                <button
                  onClick={() => handleFontScale("up")}
                  disabled={preferences.fontScale === 1.5}
                  className="flex-1 py-2.5 px-3 border border-[var(--color-border)] rounded-md font-medium text-[var(--color-navy)] hover:bg-[var(--color-surface-soft)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  aria-label="Aumentar tamanho do texto"
                >A+</button>
              </div>
            </section>

            <section aria-labelledby="a11y-contrast-title">
              <h3 id="a11y-contrast-title" className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Cores e Contraste
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleContrast("default")}
                  className={`py-2.5 px-3 border rounded-md font-medium text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${preferences.contrast === "default" ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`}
                  aria-pressed={preferences.contrast === "default"}
                >Padrao</button>
                <button
                  onClick={() => handleContrast("high")}
                  className={`py-2.5 px-3 border rounded-md font-medium text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${preferences.contrast === "high" ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`}
                  aria-pressed={preferences.contrast === "high"}
                >Alto Contraste</button>
                <button
                  onClick={() => handleContrast("inverted")}
                  className={`py-2.5 px-3 border rounded-md font-medium text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${preferences.contrast === "inverted" ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`}
                  aria-pressed={preferences.contrast === "inverted"}
                >Cores Invertidas</button>
                <button
                  onClick={() => toggleBooleanPref("grayscale", "Escala de cinza")}
                  className={`py-2.5 px-3 border rounded-md font-medium text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${preferences.grayscale ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`}
                  aria-pressed={preferences.grayscale}
                >Monocromatico</button>
              </div>
            </section>

            <section aria-labelledby="a11y-focus-title">
              <h3 id="a11y-focus-title" className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <EyeOff className="w-4 h-4" /> Navegacao e Leitura
              </h3>
              <div className="space-y-3">
                <ToggleRow label="Destacar links" icon={<LinkIcon className="w-4 h-4" />} checked={preferences.underlineLinks} onChange={() => toggleBooleanPref("underlineLinks", "Destacar links")} />
                <ToggleRow label="Destacar foco do teclado" icon={<Maximize2 className="w-4 h-4" />} checked={preferences.enhancedFocus} onChange={() => toggleBooleanPref("enhancedFocus", "Destacar foco")} />
                <ToggleRow label="Reduzir animacoes" icon={<SunMoon className="w-4 h-4" />} checked={preferences.reducedMotion} onChange={() => toggleBooleanPref("reducedMotion", "Animacoes")} />
                <ToggleRow label="Guia de leitura" icon={<MoveHorizontal className="w-4 h-4" />} checked={preferences.readingGuide} onChange={() => toggleBooleanPref("readingGuide", "Guia")} />
              </div>
            </section>

            <section aria-labelledby="a11y-spacing-title">
              <h3 id="a11y-spacing-title" className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Espacamento
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-2">Espacamento de Linhas</label>
                <div className="flex gap-2">
                  {(["default", "comfortable", "wide"] as const).map(mode => (
                    <button key={`line-${mode}`} onClick={() => updatePreference("lineSpacing", mode)} className={`flex-1 py-1.5 px-2 border rounded font-medium text-xs ${preferences.lineSpacing === mode ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`} aria-pressed={preferences.lineSpacing === mode}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-2">Espacamento de Letras</label>
                <div className="flex gap-2">
                  {(["default", "comfortable", "wide"] as const).map(mode => (
                    <button key={`letter-${mode}`} onClick={() => updatePreference("letterSpacing", mode)} className={`flex-1 py-1.5 px-2 border rounded font-medium text-xs ${preferences.letterSpacing === mode ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "border-[var(--color-border)] text-[var(--color-navy)]"}`} aria-pressed={preferences.letterSpacing === mode}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="a11y-tools-title">
              <h3 id="a11y-tools-title" className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <Ear className="w-4 h-4" /> Ferramentas Auxiliares
              </h3>
              <div className="space-y-3">
                <ToggleRow label="Ativar VLibras" icon={<span className="font-bold text-sm">libras</span>} checked={preferences.vlibrasEnabled} onChange={() => toggleBooleanPref("vlibrasEnabled", "VLibras")} />
              </div>
            </section>

          </div>

          <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]">
            <button onClick={() => { resetPreferences(); announceToScreenReader("Restaurado") }} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[var(--color-border)] rounded-md font-bold text-[var(--color-navy)] hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors">
              <RotateCcw className="w-4 h-4" /> Restaurar Padroes
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ToggleRow({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: () => void, icon: React.ReactNode }) {
  const id = React.useId()
  return (
    <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md bg-white">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-[var(--color-navy)] cursor-pointer select-none">
        {icon}
        {label}
      </label>
      <Switch.Root id={id} checked={checked} onCheckedChange={onChange} className="w-10 h-5 bg-gray-200 rounded-full relative data-[state=checked]:bg-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 transition-colors cursor-pointer" aria-label={label}>
        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
      </Switch.Root>
    </div>
  )
}
