import type { Priority } from "./types"
import { db } from "./db"

const DEFAULT_PRIORITIES: Omit<Priority, "id" | "createdAt" | "workspaceId">[] = [
  { name: "Low", color: "#22c55e", order: 0 },
  { name: "Medium", color: "#eab308", order: 1 },
  { name: "High", color: "#ef4444", order: 2 },
]

let initializationLock = false

export class PriorityService {
  static async getAllPriorities(workspaceId: string): Promise<Priority[]> {
    try {
      const priorities = await db.getAllByWorkspace<Priority>("priorities", workspaceId)
      return priorities.sort((a, b) => a.order - b.order)
    } catch (error) {
      console.error("Error fetching priorities:", error)
      return []
    }
  }

  static async ensureDefaultPriorities(workspaceId: string): Promise<void> {
    if (initializationLock) {
      return
    }

    initializationLock = true

    try {
      const priorities = await db.getAllByWorkspace<Priority>("priorities", workspaceId)
      if (priorities.length === 0) {
        await this.initializeDefaultPriorities(workspaceId)
      }
    } catch (error) {
      console.error("Error ensuring default priorities:", error)
    } finally {
      initializationLock = false
    }
  }

  static async getPriority(id: string): Promise<Priority | undefined> {
    try {
      return await db.get<Priority>("priorities", id)
    } catch (error) {
      console.error("Error fetching priority:", error)
      return undefined
    }
  }

  static async createPriority(priorityData: Partial<Priority>, workspaceId: string): Promise<Priority> {
    const now = new Date().toISOString()
    const existingPriorities = await this.getAllPriorities(workspaceId)
    const maxOrder = Math.max(...existingPriorities.map((p) => p.order), -1)

    const priority: Priority = {
      id: crypto.randomUUID(),
      name: priorityData.name || "",
      color: priorityData.color || "#6b7280",
      order: priorityData.order ?? maxOrder + 1,
      createdAt: now,
      workspaceId,
    }

    try {
      await db.add("priorities", priority)
      return priority
    } catch (error) {
      console.error("Error creating priority:", error)
      throw error
    }
  }

  static async updatePriority(id: string, updates: Partial<Priority>): Promise<Priority> {
    try {
      const existingPriority = await db.get<Priority>("priorities", id)
      if (!existingPriority) {
        throw new Error("Priority not found")
      }

      const updatedPriority: Priority = {
        ...existingPriority,
        ...updates,
        id, // Ensure ID doesn't change
      }

      await db.put("priorities", updatedPriority)
      return updatedPriority
    } catch (error) {
      console.error("Error updating priority:", error)
      throw error
    }
  }

  static async deletePriority(id: string): Promise<void> {
    try {
      await db.delete("priorities", id)
    } catch (error) {
      console.error("Error deleting priority:", error)
      throw error
    }
  }

  static async updatePriorityOrder(priorityIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < priorityIds.length; i++) {
        const priorityId = priorityIds[i]
        const priority = await db.get<Priority>("priorities", priorityId)
        if (priority) {
          priority.order = i
          await db.put<Priority>("priorities", priority)
        }
      }
    } catch (error) {
      console.error("Error updating priority order:", error)
      throw error
    }
  }

  private static async initializeDefaultPriorities(workspaceId: string): Promise<void> {
    const now = new Date().toISOString()

    for (const priorityData of DEFAULT_PRIORITIES) {
      const priority: Priority = {
        id: crypto.randomUUID(),
        ...priorityData,
        createdAt: now,
        workspaceId,
      }

      try {
        await db.add("priorities", priority)
      } catch (error) {
        console.error("Error initializing default priority:", error)
      }
    }
  }
}
