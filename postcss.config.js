export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

// Note: You may see Lightning CSS warnings about :global() pseudo-class during build.
// These are harmless - Svelte's :global() syntax is processed correctly by the Svelte
// compiler before Lightning CSS sees it. The warnings appear because Lightning CSS
// doesn't recognize :global() as standard CSS, but the generated CSS is valid and works
// correctly. This is a known issue with Tailwind v4 + Svelte + Lightning CSS.
