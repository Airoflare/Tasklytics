import type { Workspace } from "./types"
import { db } from "./db"

const DEFAULT_WORKSPACE: Omit<Workspace, "id" | "createdAt"> = {
  name: "My Workspace",
  icon: "/logo.webp",
}

let initializationLock = false

export class WorkspaceService {
  static async getAllWorkspaces(): Promise<Workspace[]> {
    try {
      return await db.getAll<Workspace>("workspaces")
    } catch (error) {
      console.error("Error fetching workspaces:", error)
      return []
    }
  }

  static async ensureDefaultWorkspace(): Promise<void> {
    if (initializationLock) {
      return
    }

    initializationLock = true

    try {
      const workspaces = await db.getAll<Workspace>("workspaces")
      if (workspaces.length === 0) {
        await this.initializeDefaultWorkspace()
      }
    } catch (error) {
      console.error("Error ensuring default workspace:", error)
    } finally {
      initializationLock = false
    }
  }

  static async getWorkspace(id: string): Promise<Workspace | undefined> {
    try {
      return await db.get<Workspace>("workspaces", id)
    } catch (error) {
      console.error("Error fetching workspace:", error)
      return undefined
    }
  }

  static async createWorkspace(workspaceData: Partial<Workspace>): Promise<Workspace> {
    const now = new Date().toISOString()
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name: workspaceData.name || "New Workspace",
      icon: workspaceData.icon || "/logo.webp",
      createdAt: now,
    }

    try {
      await db.add("workspaces", workspace)
      return workspace
    } catch (error) {
      console.error("Error creating workspace:", error)
      throw error
    }
  }

  static async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    try {
      const existingWorkspace = await db.get<Workspace>("workspaces", id)
      if (!existingWorkspace) {
        throw new Error("Workspace not found")
      }

      const updatedWorkspace: Workspace = {
        ...existingWorkspace,
        ...updates,
        id, // Ensure ID doesn't change
      }

      await db.put("workspaces", updatedWorkspace)
      return updatedWorkspace
    } catch (error) {
      console.error("Error updating workspace:", error)
      throw error
    }
  }

  static async deleteWorkspace(id: string): Promise<void> {
    try {
      // Delete all data associated with this workspace
      const tasks = await db.getAllByWorkspace("tasks", id)
      const statuses = await db.getAllByWorkspace("statuses", id)
      const tags = await db.getAllByWorkspace("tags", id)
      const priorities = await db.getAllByWorkspace("priorities", id)
      const attachments = await db.getAllByWorkspace("attachments", id)

      // Delete tasks
      for (const task of tasks as any[]) {
        await db.delete("tasks", task.id)
      }

      // Delete statuses
      for (const status of statuses as any[]) {
        await db.delete("statuses", status.id)
      }

      // Delete tags
      for (const tag of tags as any[]) {
        await db.delete("tags", tag.id)
      }

      // Delete priorities
      for (const priority of priorities as any[]) {
        await db.delete("priorities", priority.id)
      }

      // Delete attachments
      for (const attachment of attachments as any[]) {
        await db.delete("attachments", attachment.id)
      }

      // Delete workspace
      await db.delete("workspaces", id)
    } catch (error) {
      console.error("Error deleting workspace:", error)
      throw error
    }
  }

  private static async initializeDefaultWorkspace(): Promise<void> {
    const now = new Date().toISOString()

    const workspace: Workspace = {
      id: crypto.randomUUID(),
      ...DEFAULT_WORKSPACE,
      createdAt: now,
    }

    try {
      await db.add("workspaces", workspace)
    } catch (error) {
      console.error("Error initializing default workspace:", error)
    }
  }
}