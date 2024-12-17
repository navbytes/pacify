import type { Languages } from '@/interfaces'
import { locale } from 'svelte-i18n'

export class LocaleManager {
  private static fallbackLocale: Languages = 'en'

  public static async initialize(language = LocaleManager.fallbackLocale) {
    locale.set(language)
  }
}
