import type { Status } from "./types"
import { db } from "./db"

const DEFAULT_STATUSES: Omit<Status, "id" | "createdAt" | "workspaceId">[] = [
  { name: "Backlog", color: "#3b82f6", order: 0 },
  { name: "In Progress", color: "#eab308", order: 1 },
  { name: "Completed", color: "#22c55e", order: 2 },
  { name: "Blocked", color: "#ef4444", order: 3 },
  { name: "Cancelled", color: "#6b7280", order: 4 },
]

let initializationLock = false

export class StatusService {
  static async getAllStatuses(workspaceId: string): Promise<Status[]> {
    try {
      const statuses = await db.getAllByWorkspace<Status>("statuses", workspaceId)
      return statuses.sort((a, b) => a.order - b.order)
    } catch (error) {
      console.error("Error fetching statuses:", error)
      return []
    }
  }

  static async ensureDefaultStatuses(workspaceId: string): Promise<void> {
    if (initializationLock) {
      return
    }

    initializationLock = true

    try {
      const statuses = await db.getAllByWorkspace<Status>("statuses", workspaceId)
      if (statuses.length === 0) {
        await this.initializeDefaultStatuses(workspaceId)
      }
    } catch (error) {
      console.error("Error ensuring default statuses:", error)
    } finally {
      initializationLock = false
    }
  }

  static async getStatus(id: string): Promise<Status | undefined> {
    try {
      return await db.get<Status>("statuses", id)
    } catch (error) {
      console.error("Error fetching status:", error)
      return undefined
    }
  }

  static async createStatus(statusData: Partial<Status>, workspaceId: string): Promise<Status> {
    const now = new Date().toISOString()
    const existingStatuses = await this.getAllStatuses(workspaceId)
    const maxOrder = Math.max(...existingStatuses.map((s) => s.order), -1)

    const status: Status = {
      id: crypto.randomUUID(),
      name: statusData.name || "",
      color: statusData.color || "#6b7280",
      order: statusData.order ?? maxOrder + 1,
      createdAt: now,
      workspaceId,
    }

    try {
      await db.add("statuses", status)
      return status
    } catch (error) {
      console.error("Error creating status:", error)
      throw error
    }
  }

  static async updateStatus(id: string, updates: Partial<Status>): Promise<Status> {
    try {
      const existingStatus = await db.get<Status>("statuses", id)
      if (!existingStatus) {
        throw new Error("Status not found")
      }

      const updatedStatus: Status = {
        ...existingStatus,
        ...updates,
        id, // Ensure ID doesn't change
      }

      await db.put("statuses", updatedStatus)
      return updatedStatus
    } catch (error) {
      console.error("Error updating status:", error)
      throw error
    }
  }

  static async deleteStatus(id: string): Promise<void> {
    try {
      await db.delete("statuses", id)
    } catch (error) {
      console.error("Error deleting status:", error)
      throw error
    }
  }

  static async updateStatusOrder(statusIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < statusIds.length; i++) {
        const statusId = statusIds[i]
        const status = await db.get<Status>("statuses", statusId)
        if (status) {
          status.order = i
          await db.put<Status>("statuses", status)
        }
      }
    } catch (error) {
      console.error("Error updating status order:", error)
      throw error
    }
  }

  private static async initializeDefaultStatuses(workspaceId: string): Promise<void> {
    const now = new Date().toISOString()

    for (const statusData of DEFAULT_STATUSES) {
      const status: Status = {
        id: crypto.randomUUID(),
        ...statusData,
        createdAt: now,
        workspaceId,
      }

      try {
        await db.add("statuses", status)
      } catch (error) {
        console.error("Error initializing default status:", error)
      }
    }
  }
}
