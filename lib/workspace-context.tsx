"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Workspace } from './types'
import { WorkspaceService } from './workspace-service'

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  setCurrentWorkspace: (workspace: Workspace) => void
  updateCurrentWorkspace: (updates: Partial<Workspace>) => void
  createWorkspace: (name: string, icon?: string | null) => Promise<Workspace>
  loadWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  const loadWorkspaces = async () => {
    try {
      await WorkspaceService.ensureDefaultWorkspace()
      const allWorkspaces = await WorkspaceService.getAllWorkspaces()
      setWorkspaces(allWorkspaces)

      // Set current workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      let workspaceToSet = allWorkspaces[0]

      if (savedWorkspaceId) {
        const savedWorkspace = allWorkspaces.find(w => w.id === savedWorkspaceId)
        if (savedWorkspace) {
          workspaceToSet = savedWorkspace
        }
      }

      if (workspaceToSet) {
        setCurrentWorkspace(workspaceToSet)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }

  const createWorkspace = async (name: string, icon?: string | null): Promise<Workspace> => {
    const workspace = await WorkspaceService.createWorkspace({ name, icon })
    await loadWorkspaces()
    return workspace
  }

  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem('currentWorkspaceId', workspace.id)
  }

  const updateCurrentWorkspace = (updates: Partial<Workspace>) => {
    if (currentWorkspace) {
      setCurrentWorkspace({ ...currentWorkspace, ...updates })
    }
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      workspaces,
      setCurrentWorkspace: handleSetCurrentWorkspace,
      updateCurrentWorkspace,
      createWorkspace,
      loadWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}