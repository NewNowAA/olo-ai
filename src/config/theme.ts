// ===========================================
// Design Tokens - TypeScript Version
// Use in JS/TS components for consistency
// ===========================================

/**
 * Primary brand colors
 */
export const colors = {
    primary: {
        teal: '#73c6df',
        mint: '#8bd7bf',
        dark: '#2e8ba6',
        darker: '#257a91',
    },
    semantic: {
        success: '#5fb397',
        successLight: '#8bd7bf',
        warning: '#f97316',
        danger: '#ef4444',
        info: '#3b82f6',
    },
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },
} as const;

/**
 * Background colors
 */
export const backgrounds = {
    light: colors.slate[50],
    dark: colors.slate[900],
    cardLight: 'rgba(255, 255, 255, 0.4)',
    cardDark: 'rgba(30, 41, 59, 0.4)',
} as const;

/**
 * Gradient definitions
 */
export const gradients = {
    primary: `linear-gradient(135deg, ${colors.primary.teal} 0%, ${colors.primary.mint} 100%)`,
    text: `linear-gradient(135deg, ${colors.primary.teal} 0%, #2dd4bf 100%)`,
    hero: 'linear-gradient(135deg, #e0f7ed 0%, #e8f6fc 50%, #f0f9f4 100%)',
    dark: `linear-gradient(135deg, ${colors.slate[900]} 0%, ${colors.slate[800]} 100%)`,
} as const;

/**
 * Box shadows
 */
export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    primary: '0 10px 40px -10px rgba(115, 198, 223, 0.3)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
} as const;

/**
 * Border radius values
 */
export const radius = {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    full: '9999px',
} as const;

/**
 * Spacing scale
 */
export const spacing = {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
} as const;

/**
 * Transition durations
 */
export const transitions = {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
} as const;

/**
 * Z-index layers
 */
export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    header: 30,
    sidebar: 40,
    modal: 50,
    tooltip: 60,
} as const;

/**
 * Combined design tokens export
 */
export const designTokens = {
    colors,
    backgrounds,
    gradients,
    shadows,
    radius,
    spacing,
    transitions,
    zIndex,
} as const;

export default designTokens;
