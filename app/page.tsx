"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TaskList } from "@/components/task-list"
import { TaskDetailView } from "@/components/task-detail-view"
import { CreateTaskModal } from "@/components/create-task-modal"
import { ViewToggle } from "@/components/view-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, BadgePlus, Filter, ArrowDownUp } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
import type { Task, Status, ViewType, Tag, Priority } from "@/lib/types"
import { TaskService } from "@/lib/task-service"
import { StatusService } from "@/lib/status-service"
import { TagService } from "@/lib/tag-service"
import { PriorityService } from "@/lib/priority-service"
import { SettingsContent } from "@/components/settings-content"
import { useTimezone } from "@/lib/timezone-context"
import { settingsService } from "@/lib/settings-service"
import { useLanguage } from "@/lib/language-context"

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>("list")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([])
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [filterDueToday, setFilterDueToday] = useState(false)
  const [filterDueThisWeek, setFilterDueThisWeek] = useState(false)
  const [filterPriorityId, setFilterPriorityId] = useState<string | null>(null)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('timeAdded-desc')
  const [appName, setAppName] = useState("Tasklytics")
  const [appIcon, setAppIcon] = useState<string | null>("/logo.webp")
  const { timezone, setTimezone } = useTimezone();
  const { language, setLanguage, t } = useLanguage();

  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTaskId = searchParams.get("task")
  const currentPage = searchParams.get("page")

  useEffect(() => {
    const savedView = localStorage.getItem("currentView") as ViewType
    if (savedView) {
      setCurrentView(savedView)
    }

    const savedStatus = localStorage.getItem("selectedStatus")
    if (savedStatus) {
      setSelectedStatus(savedStatus)
    }

    
    // Load app name from IndexedDB
    const loadAppName = async () => {
      const storedAppName = await settingsService.getAppName()
      if (storedAppName) {
        setAppName(storedAppName)
      }
    }
    loadAppName()

    // Load app icon from IndexedDB
    const loadAppIcon = async () => {
      const storedAppIcon = await settingsService.getAppIcon()
      if (storedAppIcon) {
        setAppIcon(storedAppIcon)
      } else {
        // Set default app icon if not found in IndexedDB
        setAppIcon("/logo.webp")
      }
    }
    loadAppIcon()

    // Initialize filter states from URL
    setFilterOverdue(searchParams.get("filterOverdue") === "true")
    setFilterDueToday(searchParams.get("filterDueToday") === "true")
    setFilterDueThisWeek(searchParams.get("filterDueThisWeek") === "true")
    setFilterPriorityId(searchParams.get("filterPriorityId") || null)
    setFilterTagIds(searchParams.get("filterTagIds")?.split(",") || [])
    setSortBy(searchParams.get("sortBy") || 'timeAdded-desc')
  }, [])

  useEffect(() => {
    localStorage.setItem("currentView", currentView)
  }, [currentView])

  useEffect(() => {
    if (selectedStatus) {
      localStorage.setItem("selectedStatus", selectedStatus)
    } else {
      localStorage.removeItem("selectedStatus")
    }
  }, [selectedStatus])

  useEffect(() => {
    const saveAppName = async () => {
      await settingsService.setAppName(appName)
    }
    saveAppName()
  }, [appName])

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        StatusService.ensureDefaultStatuses(),
        TagService.ensureDefaultTags(),
        PriorityService.ensureDefaultPriorities(),
      ])
      await loadData()
    }
    initialize()
  }, [])

  const loadData = async () => {
    const [tasksData, statusesData, tagsData, prioritiesData] = await Promise.all([
      TaskService.getAllTasks(),
      StatusService.getAllStatuses(),
      TagService.getAllTags(),
      PriorityService.getAllPriorities(),
    ])
    setTasks(tasksData)
    setStatuses(statusesData)
    setTags(tagsData)
    setPriorities(prioritiesData)
  }

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    const newTask = await TaskService.createTask(taskData)
    await loadData()
    setIsCreateModalOpen(false)
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );

    try {
      await TaskService.updateTask(taskId, updates);
    } catch (error) {
      console.error("Failed to update task, reverting optimistic update:", error);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? tasks.find((t) => t.id === taskId) || task : task))
      );
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    await TaskService.deleteTask(taskId)
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) {
      const currentParams = new URLSearchParams(searchParams.toString())
      currentParams.delete("task")
      currentParams.delete("page")
      router.replace(`/?${currentParams.toString()}`)
    }
  }

  const handleStatusVisibilityToggle = (statusId: string) => {
    setHiddenStatuses((prevHiddenStatuses) => {
      if (prevHiddenStatuses.includes(statusId)) {
        return prevHiddenStatuses.filter((id) => id !== statusId)
      } else {
        return [...prevHiddenStatuses, statusId]
      }
    })
  }

  const visibleStatuses = statuses.filter((status) => !hiddenStatuses.includes(status.id))

  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const handleAppIconChange = async (value: string | null | React.ChangeEvent<HTMLInputElement>) => {
    if (value === null) {
      setAppIcon("/logo.webp");
      await settingsService.setAppIcon("/logo.webp");
    } else if (typeof value === 'string') {
      setAppIcon(value);
      await settingsService.setAppIcon(value);
    } else { // It's a ChangeEvent
      const file = value.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          setAppIcon(base64String);
          await settingsService.setAppIcon(base64String);
        };
        reader.readAsDataURL(file);
      } else {
        setAppIcon(null);
        await settingsService.setAppIcon(null);
      }
    }
  };

  

  const getSortedTasks = (tasksToSort: Task[]) => {
    const [criteria, order] = (sortBy || 'timeAdded-desc').split('-');

    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;

      if (criteria === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (criteria === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (criteria === 'timeAdded') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  };

  const getFilteredTasks = () => {
    let tasksToFilter = selectedStatus ? tasks.filter((task) => task.statusId === selectedStatus) : tasks

    if (searchQuery) {
      tasksToFilter = tasksToFilter.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    const now = new Date()
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59)

    return tasksToFilter.filter((task) => {
      const taskDeadline = task.deadline ? new Date(task.deadline) : null
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59)

      // Apply Overdue filter
      if (filterOverdue && (!taskDeadline || taskDeadline >= now)) {
        return false
      }

      // Apply Due Today filter
      if (filterDueToday && (!taskDeadline || taskDeadline < startOfDay || taskDeadline > endOfDay)) {
        return false
      }

      // Apply Due This Week filter
      if (filterDueThisWeek && (!taskDeadline || taskDeadline < startOfWeek || taskDeadline > endOfWeek)) {
        return false
      }

      // Apply Priority filter
      if (filterPriorityId && task.priorityId !== filterPriorityId) {
        return false
      }

      // Apply Tag filter
      if (filterTagIds.length > 0 && !task.tags.some(tagId => filterTagIds.includes(tagId))) {
        return false
      }

      return true
    })
  }

  const filteredTasks = getSortedTasks(getFilteredTasks())

  const getStatusCounts = () => {
    return visibleStatuses.map((status) => ({
      ...status,
      count: tasks.filter((task) => task.statusId === status.id).length,
    }))
  }

  const getHeaderTitle = () => {
    if (currentPage === "settings") {
      return t("Settings")
    }
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId)
      return task ? task.title : t("Task Details")
    }
    if (selectedStatus === null) {
      return t("All Tasks")
    }
    const status = statuses.find((s) => s.id === selectedStatus)
    return status ? status.name : t("Tasks")
  }

  const handleTaskSelect = (task: Task) => {
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("task", task.id)
    currentParams.delete("page") // Ensure settings page is closed
    currentParams.delete("status") // Ensure status filter is cleared
    router.replace(`/?${currentParams.toString()}`)
  }

  const handleCloseTask = () => {
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.delete("task")
    currentParams.delete("page") // Ensure settings page is closed
    currentParams.delete("status") // Ensure status filter is cleared
    router.replace(`/?${currentParams.toString()}`)
  }

  const handleSearchToggle = () => {
    if (isSearchExpanded) {
      setSearchQuery("")
      setIsSearchExpanded(false)
    } else {
      setIsSearchExpanded(true)
    }
  }

  const handleSettingsClick = () => {
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("page", "settings")
    currentParams.delete("task") // Ensure task detail is closed
    currentParams.delete("status") // Ensure status filter is cleared
    router.replace(`/?${currentParams.toString()}`)
  }

  const handleStatusSelect = (statusId: string | null) => {
    setSelectedStatus(statusId)
    if (statusId !== null) {
      setCurrentView("list")
    }
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.delete("page") // Remove the page parameter
    currentParams.delete("task") // Remove task parameter if present
    if (statusId) {
      currentParams.set("status", statusId)
    } else {
      currentParams.delete("status") // For "All Tasks"
    }
    router.replace(`/?${currentParams.toString()}`)
  }


  const updateUrlParams = (newFilters: {
    overdue?: boolean;
    dueToday?: boolean;
    dueThisWeek?: boolean;
    priorityId?: string | null;
    tagIds?: string[];
  }) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    if (newFilters.overdue !== undefined) {
      if (newFilters.overdue) {
        currentParams.set("filterOverdue", "true");
      } else {
        currentParams.delete("filterOverdue");
      }
    }
    if (newFilters.dueToday !== undefined) {
      if (newFilters.dueToday) {
        currentParams.set("filterDueToday", "true");
      } else {
        currentParams.delete("filterDueToday");
      }
    }
    if (newFilters.dueThisWeek !== undefined) {
      if (newFilters.dueThisWeek) {
        currentParams.set("filterDueThisWeek", "true");
      } else {
        currentParams.delete("filterDueThisWeek");
      }
    }
    if (newFilters.priorityId !== undefined) {
      if (newFilters.priorityId) {
        currentParams.set("filterPriorityId", newFilters.priorityId);
      } else {
        currentParams.delete("filterPriorityId");
      }
    }
    if (newFilters.tagIds !== undefined) {
      if (newFilters.tagIds.length > 0) {
        currentParams.set("filterTagIds", newFilters.tagIds.join(","));
      } else {
        currentParams.delete("filterTagIds");
      }
    }

    router.replace(`/?${currentParams.toString()}`);
  }

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null

  return (
      <div className="flex h-screen dark:bg-black text-white">
      <Sidebar
        statuses={getStatusCounts()}
        selectedStatus={selectedStatus}
        onStatusSelect={handleStatusSelect}
        onSettingsClick={handleSettingsClick}
        appName={appName}
        appIcon={appIcon}
      />

      {currentPage === "settings" ? (
        <SettingsContent
          statuses={statuses}
          tags={tags}
          tasks={tasks}
          appName={appName}
          setAppName={setAppName}
          appIcon={appIcon}
          setAppIcon={handleAppIconChange}
          timezone={timezone}
          setTimezone={setTimezone}
          language={language}
          setLanguage={setLanguage}
          onStatusSelect={handleStatusSelect}
          onSettingsClick={handleSettingsClick}
          onStatusReorder={async (reorderedStatuses) => {
            setStatuses(reorderedStatuses);
            await StatusService.updateStatusOrder(reorderedStatuses.map(s => s.id));
          }}
          onStatusCreate={async (statusData) => {
            await StatusService.createStatus(statusData);
            await loadData();
          }}
          onStatusUpdate={async (statusId, updates) => {
            await StatusService.updateStatus(statusId, updates);
            await loadData();
          }}
          onStatusDelete={async (statusId) => {
            await StatusService.deleteStatus(statusId);
            await loadData();
          }}
          onTagCreate={async (tagData) => {
            await TagService.createTag(tagData);
            await loadData();
          }}
          onTagUpdate={async (tagId, updates) => {
            await TagService.updateTag(tagId, updates);
            await loadData();
          }}
          onTagDelete={async (tagId) => {
            await TagService.deleteTag(tagId);
            await loadData();
          }}
          priorities={priorities}
          onPriorityCreate={async (priorityData) => {
            await PriorityService.createPriority(priorityData);
            await loadData();
          }}
          onPriorityUpdate={async (priorityId, updates) => {
            await PriorityService.updatePriority(priorityId, updates);
            await loadData();
          }}
          onPriorityDelete={async (priorityId) => {
            await PriorityService.deletePriority(priorityId);
            await loadData();
          }}
          onPriorityReorder={async (reorderedPriorities) => {
            setPriorities(reorderedPriorities);
            await PriorityService.updatePriorityOrder(reorderedPriorities.map(p => p.id));
          }}
        />
      ) : selectedTaskId ? (
        <TaskDetailView
          task={selectedTask}
          tasks={tasks}
          statuses={visibleStatuses}
          tags={tags}
          onClose={handleCloseTask}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onNavigate={handleTaskSelect}
          priorities={priorities}
        />
      ) : (
        <main key={language} className="flex-1 flex flex-col min-w-0">
          <div className="border-b bg-background/95 dark:bg-black border-black/5 dark:border-white/5 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
            <div className="px-6 py-2 flex h-20 items-center justify-between">
              <h1 className="text-md font-normal  text-[#737373] dark:text-[#E8E7EA]">{getHeaderTitle()}</h1>

              <div className="flex items-center space-x-2 ">
                {selectedStatus === null && <ViewToggle currentView={currentView} onViewChange={setCurrentView} />}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                      <ArrowDownUp className="w-4 h-4 text-[#737373] dark:text-white/90" />
                      {sortBy !== 'timeAdded-desc' && ( // Only show dot if not default sort
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border-black/10 dark:bg-[#090909] dark:border-[#262626]/50">
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                      <DropdownMenuLabel className="text-xs font-medium text-black/40 dark:text-[#9E9E9E] tracking-wider px-2 py-1.5">{t("Sort by Task Name")}</DropdownMenuLabel>
                      <DropdownMenuRadioItem value="title-asc" 
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Ascending (A -> Z)")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="title-desc"
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Descending (Z -> A)")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] tracking-wider px-2 py-1.5">{t("Sort by Deadline")}</DropdownMenuLabel>
                      <DropdownMenuRadioItem value="deadline-asc"
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Due Soon")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="deadline-desc"
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Due Later")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-medium text-[#737373] dark:text-[#9E9E9E] tracking-wider px-2 py-1.5">{t("Sort by Task Age")}</DropdownMenuLabel>
                      <DropdownMenuRadioItem value="timeAdded-asc"
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Oldest first")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="timeAdded-desc"
                        className=" text-black/60 dark:text-white/85 ">
                        {t("Newest first (default)")}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                      <Filter className="w-4 h-4  text-[#737373] dark:text-white/90" />
                      {(filterOverdue || filterDueToday || filterDueThisWeek || filterPriorityId || filterTagIds.length > 0) && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border-black/10 dark:bg-[#090909] dark:border-[#262626]/50">
                    <DropdownMenuLabel className="text-xs font-medium text-black/40 dark:text-[#9E9E9E]">{t("Filter Tasks")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      className=" text-black/60 dark:text-white/85"
                      checked={filterOverdue}
                      onCheckedChange={(checked) => {
                        setFilterOverdue(checked);
                        if (checked) {
                          setFilterDueToday(false);
                          setFilterDueThisWeek(false);
                        }
                        updateUrlParams({
                          overdue: checked,
                          dueToday: false,
                          dueThisWeek: false,
                        });
                      }}
                    >
                      {t("Overdue Tasks")}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      className=" text-black/60 dark:text-white/85"
                      checked={filterDueToday}
                      onCheckedChange={(checked) => {
                        setFilterDueToday(checked);
                        if (checked) {
                          setFilterOverdue(false);
                          setFilterDueThisWeek(false);
                        }
                        updateUrlParams({
                          overdue: false,
                          dueToday: checked,
                          dueThisWeek: false,
                        });
                      }}
                    >
                      {t("Tasks Due Today")}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      className=" text-black/60 dark:text-white/85"
                      checked={filterDueThisWeek}
                      onCheckedChange={(checked) => {
                        setFilterDueThisWeek(checked);
                        if (checked) {
                          setFilterOverdue(false);
                          setFilterDueToday(false);
                        }
                        updateUrlParams({
                          overdue: false,
                          dueToday: false,
                          dueThisWeek: checked,
                        });
                      }}
                    >
                      {t("Tasks Due This Week")}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-medium text-black/40 dark:text-[#9E9E9E]">{t("Filter by Priority")}</DropdownMenuLabel>
                    {priorities.map((priority) => (
                      <DropdownMenuCheckboxItem
                        className=" text-black/60 dark:text-white/85"
                        key={priority.id}
                        checked={filterPriorityId === priority.id}
                        onCheckedChange={() => {
                          const newPriorityId = filterPriorityId === priority.id ? null : priority.id;
                          setFilterPriorityId(newPriorityId);
                          updateUrlParams({ priorityId: newPriorityId });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.color }} />
                          {priority.name}
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-medium text-black/40 dark:text-[#9E9E9E]">{t("Filter by Tag")}</DropdownMenuLabel>
                    {tags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        className=" text-black/60 dark:text-white/85"
                        key={tag.id}
                        checked={filterTagIds.includes(tag.id)}
                        onCheckedChange={() => {
                          const newFilterTagIds = filterTagIds.includes(tag.id)
                            ? filterTagIds.filter((id) => id !== tag.id)
                            : [...filterTagIds, tag.id];
                          setFilterTagIds(newFilterTagIds);
                          updateUrlParams({ tagIds: newFilterTagIds });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                       className="text-m font-normal dark:text-white/90 text-black/90"
                      onClick={() => {
                      setFilterOverdue(false)
                      setFilterDueToday(false)
                      setFilterDueThisWeek(false)
                      setFilterPriorityId(null)
                      setFilterTagIds([])
                      updateUrlParams({
                        overdue: false,
                        dueToday: false,
                        dueThisWeek: false,
                        priorityId: null,
                        tagIds: [],
                      });
                    }}>
                      {t("Reset Filters")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center">
                  {isSearchExpanded ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t("Search tasks...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 h-8 text-sm dark:border-[#262626] dark:bg-[#151515] border-black/15 text-black/90 dark:text-white/90"
                        autoFocus
                      />
                      <Button variant="ghost" size="sm" onClick={handleSearchToggle} className="h-8 w-8 p-0">
                        <X className="w-4 h-4  text-[#737373] dark:text-white/90" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={handleSearchToggle} className="h-8 w-8 p-0">
                      <Search className="w-4 h-4 stroke-[2.4]  text-[#737373] dark:text-white/90" />
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <BadgePlus className="w-4 h-4 stroke-[2.4]  text-[#737373] dark:text-white/90" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TaskList
              tasks={filteredTasks}
              statuses={visibleStatuses}
              priorities={priorities}
              viewType={currentView}
              onTaskSelect={handleTaskSelect}
              onTaskUpdate={handleTaskUpdate}
              searchQuery={searchQuery}
              filterOverdue={filterOverdue}
              filterDueToday={filterDueToday}
              filterDueThisWeek={filterDueThisWeek}
              filterPriorityId={filterPriorityId}
              filterTagIds={filterTagIds}
            />
          </div>
        </main>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleTaskCreate}
        statuses={visibleStatuses}
        tags={tags}
        priorities={priorities}
      />
    </div>
  )
}
