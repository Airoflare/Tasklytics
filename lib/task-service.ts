import type { Task } from "./types"
import { db } from "./db"

export class TaskService {
  static async getAllTasks(): Promise<Task[]> {
    try {
      return await db.getAll<Task>("tasks")
    } catch (error) {
      console.error("Error fetching tasks:", error)
      return []
    }
  }

  static async getTask(id: string): Promise<Task | undefined> {
    try {
      return await db.get<Task>("tasks", id)
    } catch (error) {
      console.error("Error fetching task:", error)
      return undefined
    }
  }

  static async createTask(taskData: Partial<Task>): Promise<Task> {
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      title: taskData.title || "",
      description: taskData.description || "",
      statusId: taskData.statusId || "",
      priorityId: taskData.priorityId || undefined,
      tags: taskData.tags || [],
      attachments: taskData.attachments || [],
      deadline: taskData.deadline,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.add("tasks", task)
      return task
    } catch (error) {
      console.error("Error creating task:", error)
      throw error
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const existingTask = await db.get<Task>("tasks", id)
      if (!existingTask) {
        throw new Error("Task not found")
      }

      const updatedTask: Task = {
        ...existingTask,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      }

      await db.put("tasks", updatedTask)
      return updatedTask
    } catch (error) {
      console.error("Error updating task:", error)
      throw error
    }
  }

  static async deleteTask(id: string): Promise<void> {
    try {
      await db.delete("tasks", id)
    } catch (error) {
      console.error("Error deleting task:", error)
      throw error
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      const tasks = await db.getAll<Task>("tasks");
      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error)
      return []
    }
  }

  static async getTask(id: string): Promise<Task | undefined> {
    try {
      const task = await db.get<Task>("tasks", id);
      return task;
    } catch (error) {
      console.error("Error fetching task:", error)
      return undefined
    }
  }
}
