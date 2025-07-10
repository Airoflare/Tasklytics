import { db } from "./db"

const APP_NAME_KEY = "appName"
const APP_ICON_KEY = "appIcon"
const LANGUAGE_KEY = "language"

export const settingsService = {
  async getAppName(): Promise<string | undefined> {
    return db.getSetting<string>(APP_NAME_KEY)
  },

  async setAppName(name: string): Promise<void> {
    await db.putSetting<string>(APP_NAME_KEY, name)
  },

  async getAppIcon(): Promise<string | undefined> {
    return db.getSetting<string>(APP_ICON_KEY)
  },

  async setAppIcon(iconDataUrl: string | null): Promise<void> {
    if (iconDataUrl === null) {
      await db.deleteSetting(APP_ICON_KEY);
    } else {
      await db.putSetting<string>(APP_ICON_KEY, iconDataUrl)
    }
  },

  async getLanguage(): Promise<string | undefined> {
    return db.getSetting<string>(LANGUAGE_KEY)
  },

  async setLanguage(lang: string): Promise<void> {
    await db.putSetting<string>(LANGUAGE_KEY, lang)
  },
}