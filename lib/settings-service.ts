import { db } from "./db"

const LANGUAGE_KEY = "language"

export const settingsService = {
  async getAppName(workspaceId: string): Promise<string | undefined> {
    return db.getSetting<string>(`appName_${workspaceId}`)
  },

  async setAppName(name: string, workspaceId: string): Promise<void> {
    await db.putSetting<string>(`appName_${workspaceId}`, name)
  },

  async getAppIcon(workspaceId: string): Promise<string | undefined> {
    return db.getSetting<string>(`appIcon_${workspaceId}`)
  },

  async setAppIcon(iconDataUrl: string | null, workspaceId: string): Promise<void> {
    const key = `appIcon_${workspaceId}`
    if (iconDataUrl === null) {
      await db.deleteSetting(key);
    } else {
      await db.putSetting<string>(key, iconDataUrl)
    }
  },

  async getLanguage(): Promise<string | undefined> {
    return db.getSetting<string>(LANGUAGE_KEY)
  },

  async setLanguage(lang: string): Promise<void> {
    await db.putSetting<string>(LANGUAGE_KEY, lang)
  },
}