import { init, register } from 'svelte-i18n'

init({ fallbackLocale: 'en', initialLocale: 'en' })

register('en', () => import('./locales/en.json'))
register('hi', () => import('./locales/hi.json'))

export { t } from 'svelte-i18n'
