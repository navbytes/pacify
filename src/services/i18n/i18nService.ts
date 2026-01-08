export class I18nService {
  static getMessage(messageName: string, substitutions?: string | string[]): string {
    return chrome.i18n.getMessage(messageName, substitutions) || messageName
  }

  static getCurrentLocale(): string {
    return chrome.i18n.getUILanguage()
  }

  static isRTL(): boolean {
    return chrome.i18n.getMessage('@@bidi_dir') === 'rtl'
  }
}
