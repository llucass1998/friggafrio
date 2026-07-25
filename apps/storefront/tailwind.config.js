/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          soft: "var(--color-surface-soft)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        navy: "var(--color-navy)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        // Mantendo para compatibilidade com partes do tema antigo
        sidebar: {
          DEFAULT: "var(--color-navy)",
          hover: "var(--color-primary)",
          active: "var(--color-accent)",
          text: "var(--color-text-muted)",
          "text-active": "var(--color-surface)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "button-sm": "var(--radius-button-sm)",
        "button": "var(--radius-button)",
        "button-lg": "var(--radius-button-lg)",
        "card-sm": "var(--radius-card-sm)",
        "card": "var(--radius-card)",
        "card-lg": "var(--radius-card-lg)",
      }
    },
  },
  plugins: [],
}
