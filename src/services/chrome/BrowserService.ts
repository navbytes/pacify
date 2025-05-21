import {
  type BrowserAPI,
  type NotificationOptions as BrowserNotificationOptions,
} from '@/interfaces/browser'

/**
 * BrowserService provides a unified interface for browser-specific APIs
 * This implementation uses Chrome APIs, but can be replaced with other browser implementations
 */
export class BrowserService implements BrowserAPI {
  // Notification API
  notifications = {
    create: async (
      id: string,
      options: BrowserNotificationOptions
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          // Cast to any to bypass strict type checking
          const chromeOptions = {
            type: options.type as chrome.notifications.TemplateType,
            iconUrl: options.iconUrl || '',
            title: options.title,
            message: options.message,
            priority: options.priority,
            requireInteraction: options.requireInteraction,
            buttons: options.buttons,
          } as any

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
      get: async (
        keys: string | string[] | null
      ): Promise<Record<string, any>> => {
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

      set: async (items: Record<string, any>): Promise<void> => {
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

      getBytesInUse: async (
        keys: string | string[] | null
      ): Promise<number> => {
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
      get: async (
        keys: string | string[] | null
      ): Promise<Record<string, any>> => {
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

      set: async (items: Record<string, any>): Promise<void> => {
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

      getBytesInUse: async (
        keys: string | string[] | null
      ): Promise<number> => {
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

    setBadgeBackgroundColor: async (details: {
      color: string
    }): Promise<void> => {
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
      addListener: (callback: (tab: any) => void): void => {
        chrome.action.onClicked.addListener(callback)
      },
      removeListener: (callback: (tab: any) => void): void => {
        chrome.action.onClicked.removeListener(callback)
      },
    },
  }

  // Runtime API
  runtime = {
    getURL: (path: string): string => {
      return chrome.runtime.getURL(path)
    },

    sendMessage: async <T>(message: T): Promise<any> => {
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

    openOptionsPage: (): void => {
      chrome.runtime.openOptionsPage()
    },

    onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: any
        ) => boolean | void
      ): void => {
        chrome.runtime.onMessage.addListener(callback)
      },
      removeListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: any
        ) => boolean | void
      ): void => {
        chrome.runtime.onMessage.removeListener(callback)
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
    query: async (queryInfo: {
      active: boolean
      currentWindow: boolean
    }): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        try {
          chrome.tabs.query(queryInfo, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(tabs)
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
  }

  // Proxy API
  proxy = {
    settings: {
      set: (details: any, callback?: () => void): void => {
        chrome.proxy.settings.set(details, callback)
      },

      clear: (details: any, callback?: () => void): void => {
        chrome.proxy.settings.clear(details, callback)
      },

      get: (details: any, callback?: (config: any) => void): void => {
        chrome.proxy.settings.get(details, callback)
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
