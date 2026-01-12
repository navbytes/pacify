import type {
  BrowserAPI,
  NotificationOptions as BrowserNotificationOptions,
  MessageSender,
  ProxySettings,
  Tab,
} from '@/interfaces/browser'

/**
 * BrowserService provides a unified interface for browser-specific APIs
 * This implementation uses Chrome APIs, but can be replaced with other browser implementations
 */
export class BrowserService implements BrowserAPI {
  // Notification API
  notifications = {
    create: async (id: string, options: BrowserNotificationOptions): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          const chromeOptions = {
            type: options.type as chrome.notifications.TemplateType,
            iconUrl: options.iconUrl || '',
            title: options.title,
            message: options.message,
            priority: options.priority,
            requireInteraction: options.requireInteraction,
            buttons: options.buttons,
          } satisfies chrome.notifications.NotificationOptions

          chrome.notifications.create(id, chromeOptions, (notificationId) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(notificationId)
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    getAll: async (): Promise<Record<string, boolean>> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.notifications.getAll((notifications) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              // Cast to the expected type
              resolve(notifications as Record<string, boolean>)
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    clear: async (id: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.notifications.clear(id, (wasCleared) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(wasCleared)
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },
  }

  // Storage API
  storage = {
    sync: {
      get: async (keys: string | string[] | null): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.sync.get(keys, (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      set: async (items: Record<string, unknown>): Promise<void> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.sync.set(items, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      getBytesInUse: async (keys: string | string[] | null): Promise<number> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.sync.getBytesInUse(keys, (bytesInUse) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve(bytesInUse)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      QUOTA_BYTES: chrome.storage.sync.QUOTA_BYTES,
    },

    local: {
      get: async (keys: string | string[] | null): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.local.get(keys, (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      set: async (items: Record<string, unknown>): Promise<void> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.local.set(items, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      getBytesInUse: async (keys: string | string[] | null): Promise<number> => {
        return new Promise((resolve, reject) => {
          try {
            chrome.storage.local.getBytesInUse(keys, (bytesInUse) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve(bytesInUse)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      QUOTA_BYTES: chrome.storage.local.QUOTA_BYTES,
    },
  }

  // Action API (Browser Action)
  action = {
    setBadgeText: async (details: { text: string }): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.action.setBadgeText(details, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve()
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    setBadgeBackgroundColor: async (details: { color: string }): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.action.setBadgeBackgroundColor(details, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve()
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    setPopup: async (details: { popup: string }): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.action.setPopup(details, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve()
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    onClicked: {
      addListener: (callback: (tab: Tab) => void): void => {
        chrome.action.onClicked.addListener(callback as unknown as (tab: chrome.tabs.Tab) => void)
      },
      removeListener: (callback: (tab: Tab) => void): void => {
        chrome.action.onClicked.removeListener(
          callback as unknown as (tab: chrome.tabs.Tab) => void
        )
      },
    },
  }

  // Runtime API
  runtime = {
    getURL: (path: string): string => {
      return chrome.runtime.getURL(path)
    },

    sendMessage: async <T>(message: T): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(response)
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    openOptionsPage: (params?: Record<string, string>): void => {
      if (params && Object.keys(params).length > 0) {
        // Build URL with query parameters
        const queryString = new URLSearchParams(params).toString()
        const optionsUrl = `${chrome.runtime.getURL('src/options/options.html')}?${queryString}`
        chrome.tabs.create({ url: optionsUrl })
      } else {
        chrome.runtime.openOptionsPage()
      }
    },

    onMessage: {
      addListener: (
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | undefined
      ): void => {
        chrome.runtime.onMessage.addListener(
          callback as unknown as (
            message: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void
          ) => boolean | undefined
        )
      },
      removeListener: (
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | undefined
      ): void => {
        chrome.runtime.onMessage.removeListener(
          callback as unknown as (
            message: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void
          ) => boolean | undefined
        )
      },
    },

    onStartup: {
      addListener: (callback: () => void): void => {
        chrome.runtime.onStartup.addListener(callback)
      },
      removeListener: (callback: () => void): void => {
        chrome.runtime.onStartup.removeListener(callback)
      },
    },

    onInstalled: {
      addListener: (callback: () => void): void => {
        chrome.runtime.onInstalled.addListener(callback)
      },
      removeListener: (callback: () => void): void => {
        chrome.runtime.onInstalled.removeListener(callback)
      },
    },

    get lastError(): { message: string } | undefined {
      const error = chrome.runtime.lastError
      if (error) {
        return { message: error.message || 'Unknown error' }
      }
      return undefined
    },
  }

  // Tabs API
  tabs = {
    query: async (queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.tabs.query(queryInfo, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(tabs as unknown as Tab[])
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },

    reload: async (tabId?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          if (tabId) {
            chrome.tabs.reload(tabId, {}, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          } else {
            chrome.tabs.reload(() => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          }
        } catch (error) {
          reject(error)
        }
      })
    },

    create: async (createProperties: { url: string }): Promise<Tab> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.tabs.create(createProperties, (tab) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(tab as unknown as Tab)
            }
          })
        } catch (error) {
          reject(error)
        }
      })
    },
  }

  // Proxy API
  proxy = {
    settings: {
      set: (details: unknown, callback?: () => void): void => {
        chrome.proxy.settings.set(
          details as chrome.types.ChromeSettingSetDetails<chrome.proxy.ProxyConfig>,
          callback || (() => {})
        )
      },

      clear: (details: unknown, callback?: () => void): void => {
        chrome.proxy.settings.clear(
          details as chrome.types.ChromeSettingClearDetails,
          callback || (() => {})
        )
      },

      get: (details: unknown, callback?: (config: ProxySettings) => void): void => {
        if (callback) {
          chrome.proxy.settings.get(details as chrome.types.ChromeSettingGetDetails, (result) =>
            callback(result as unknown as ProxySettings)
          )
        } else {
          chrome.proxy.settings.get(details as chrome.types.ChromeSettingGetDetails, () => {})
        }
      },
    },
  }

  // Singleton instance
  private static instance: BrowserService

  // Get singleton instance
  public static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService()
    }
    return BrowserService.instance
  }
}

// Export a singleton instance
export const browserService = BrowserService.getInstance()
