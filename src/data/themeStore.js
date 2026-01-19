// Theme configuration store for ZenMedix
// Based on estetica-dashboard implementation

// Available color themes: Médico (original blue) and Premium Verde Lima
export const THEMES = {
    medico: {
        id: 'medico',
        name: 'Médico',
        description: 'Azul profesional médico',
        colors: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
        },
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        description: 'Verde lima fintech',
        colors: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
        },
    },
}

export const MODES = ['light', 'dark', 'system']

// Get current theme
export function getConfigTheme() {
    return localStorage.getItem('medflow_theme') || 'medico'
}

export function saveConfigTheme(theme) {
    localStorage.setItem('medflow_theme', theme)
    applyTheme(theme)
}

// Get current mode
export function getConfigMode() {
    return localStorage.getItem('medflow_mode') || 'light'
}

export function saveConfigMode(mode) {
    localStorage.setItem('medflow_mode', mode)
    applyMode(mode)
}

// Apply theme colors - Force update CSS immediately
export function applyTheme(themeId) {
    const theme = THEMES[themeId] || THEMES.medico
    const root = document.documentElement

    // Apply each color as CSS variable
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--primary-${key}`, value)
    })

    // Force repaint
    root.style.display = 'none'
    root.offsetHeight // trigger reflow
    root.style.display = ''
}

// Apply dark/light mode
export function applyMode(mode) {
    const root = document.documentElement

    if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
    } else {
        root.classList.toggle('dark', mode === 'dark')
    }
}

// Initialize theme on app load
export function initializeTheme() {
    const theme = getConfigTheme()
    const mode = getConfigMode()

    applyTheme(theme)
    applyMode(mode)

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (getConfigMode() === 'system') {
            document.documentElement.classList.toggle('dark', e.matches)
        }
    })
}
