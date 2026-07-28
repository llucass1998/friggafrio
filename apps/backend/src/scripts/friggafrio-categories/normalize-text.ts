export function normalizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s-]/g, " ") // Substitui pontuação por espaço
    .replace(/\s+/g, " ") // Remove espaços duplicados
    .trim()
}
