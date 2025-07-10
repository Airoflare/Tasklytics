import type { Tag } from "./types"
import { db } from "./db"

const DEFAULT_TAGS: Omit<Tag, "id" | "createdAt">[] = [
  { name: "Personal", color: "#22c55e" },
  { name: "Learning", color: "#eab308" },
  { name: "Work", color: "#3b82f6" },
]

let initializationLock = false

export class TagService {
  static async getAllTags(): Promise<Tag[]> {
    try {
      const tags = await db.getAll<Tag>("tags")
      return tags
    } catch (error) {
      console.error("Error fetching tags:", error)
      return []
    }
  }

  static async ensureDefaultTags(): Promise<void> {
    if (initializationLock) {
      return
    }

    initializationLock = true

    try {
      const tags = await db.getAll<Tag>("tags")
      if (tags.length === 0) {
        await this.initializeDefaultTags()
      }
    } catch (error) {
      console.error("Error ensuring default tags:", error)
    } finally {
      initializationLock = false
    }
  }

  static async getTag(id: string): Promise<Tag | undefined> {
    try {
      return await db.get<Tag>("tags", id)
    } catch (error) {
      console.error("Error fetching tag:", error)
      return undefined
    }
  }

  static async createTag(tagData: Partial<Tag>): Promise<Tag> {
    const now = new Date().toISOString()

    const tag: Tag = {
      id: crypto.randomUUID(),
      name: tagData.name || "",
      color: tagData.color || "#6b7280",
      createdAt: now,
    }

    try {
      await db.add("tags", tag)
      return tag
    } catch (error) {
      console.error("Error creating tag:", error)
      throw error
    }
  }

  static async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    try {
      const existingTag = await db.get<Tag>("tags", id)
      if (!existingTag) {
        throw new Error("Tag not found")
      }

      const updatedTag: Tag = {
        ...existingTag,
        ...updates,
        id, // Ensure ID doesn't change
      }

      await db.put("tags", updatedTag)
      return updatedTag
    } catch (error) {
      console.error("Error updating tag:", error)
      throw error
    }
  }

  static async deleteTag(id: string): Promise<void> {
    try {
      await db.delete("tags", id)
    } catch (error) {
      console.error("Error deleting tag:", error)
      throw error
    }
  }

  private static async initializeDefaultTags(): Promise<void> {
    const now = new Date().toISOString()

    for (const tagData of DEFAULT_TAGS) {
      const tag: Tag = {
        id: crypto.randomUUID(),
        ...tagData,
        createdAt: now,
      }

      try {
        await db.add("tags", tag)
      } catch (error) {
        console.error("Error initializing default tag:", error)
      }
    }
  }
}
