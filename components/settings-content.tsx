"use client"

import { useState } from "react"
import type { Status, Tag, Task, Priority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GripVertical, X, PencilLine, Bookmark, Trash2, Flame, Database, Leaf, Activity, Upload, Fan } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

import { useLanguage, LanguageKey } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { db } from "@/lib/db"

interface SettingsContentProps {
  statuses: Status[]
  tags: Tag[]
  tasks: Task[]
  appName: string
  setAppName: (name: string) => void
  appIcon: string | null
  setAppIcon: (value: string | null | React.ChangeEvent<HTMLInputElement>) => void
  timezone: string
  setTimezone: (timezone: string) => void
  language: LanguageKey
  setLanguage: (lang: LanguageKey) => void
  onStatusCreate: (statusData: Partial<Status>) => Promise<void>
  onStatusUpdate: (statusId: string, updates: Partial<Status>) => Promise<void>
  onStatusDelete: (statusId: string) => Promise<void>
  onTagCreate: (tagData: Partial<Tag>) => Promise<void>
  onTagUpdate: (tagId: string, updates: Partial<Tag>) => Promise<void>
  onTagDelete: (tagId: string) => Promise<void>
  onStatusReorder: (reorderedStatuses: Status[]) => Promise<void>
  priorities: Priority[]
  onPriorityCreate: (priorityData: Partial<Priority>) => Promise<void>
  onPriorityUpdate: (priorityId: string, updates: Partial<Priority>) => Promise<void>
  onPriorityDelete: (priorityId: string) => Promise<void>
  onPriorityReorder: (reorderedPriorities: Priority[]) => Promise<void>
  onStatusSelect: (statusId: string | null) => void
  onSettingsClick: () => void
}

export function SettingsContent({
  statuses,
  tags,
  tasks,
  appName,
  setAppName,
  appIcon,
  setAppIcon,
  timezone,
  setTimezone,
  language,
  setLanguage,
  onStatusCreate,
  onStatusUpdate,
  onStatusDelete,
  onTagCreate,
  onTagUpdate,
  onTagDelete,
  onStatusReorder,
  priorities,
  onPriorityCreate,
  onPriorityUpdate,
  onPriorityDelete,
}: SettingsContentProps) {
  const { t } = useLanguage();
  const { currentWorkspace } = useWorkspace();
  const [newStatusName, setNewStatusName] = useState("")
  const [newStatusColor, setNewStatusColor] = useState("#1e90ff")
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)

  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#1e90ff")
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const [newPriorityName, setNewPriorityName] = useState("")
  const [newPriorityColor, setNewPriorityColor] = useState("#1e90ff")
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)
  const [showManualExport, setShowManualExport] = useState(false)
  const [exportData, setExportData] = useState<string>('')

  const handleStatusSubmit = () => {
    if (editingStatus) {
      onStatusUpdate(editingStatus.id, {
        name: newStatusName,
        color: newStatusColor,
      })
    } else {
      onStatusCreate({ name: newStatusName, color: newStatusColor })
    }
    setNewStatusName("")
    setNewStatusColor("#ffffff")
    setEditingStatus(null)
  }

  const handleTagSubmit = () => {
    if (editingTag) {
      onTagUpdate(editingTag.id, {
        name: newTagName,
        color: newTagColor,
      })
    } else {
      onTagCreate({ name: newTagName, color: newTagColor })
    }
    setNewTagName("")
    setNewTagColor("#ffffff")
    setEditingTag(null)
  }

  const handlePrioritySubmit = () => {
    if (editingPriority) {
      onPriorityUpdate(editingPriority.id, {
        name: newPriorityName,
        color: newPriorityColor,
      })
    } else {
      onPriorityCreate({ name: newPriorityName, color: newPriorityColor })
    }
    setNewPriorityName("")
    setNewPriorityColor("#ffffff")
    setEditingPriority(null)
  }

  const startEditingStatus = (status: Status) => {
    setEditingStatus(status)
    setNewStatusName(status.name)
    setNewStatusColor(status.color)
  }

  const startEditingTag = (tag: Tag) => {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
  }

  const startEditingPriority = (priority: Priority) => {
    setEditingPriority(priority)
    setNewPriorityName(priority.name)
    setNewPriorityColor(priority.color)
  }

  const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

  const allTimezones = [
    { value: "auto", label: `Auto-detect (${getBrowserTimezone()})` },
    ...Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz }))
  ];

  const handleExportData = async () => {
    try {
      const data = await db.exportData();
      const jsonString = JSON.stringify(data, null, 2);

      // For WebKit packaged apps, downloads are often blocked
      // Let's try a different approach - create a temporary link and simulate click
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = url;
      a.download = "Tasklytics_backup.json";
      a.style.display = "none";

      // Add to body, click, and remove
      document.body.appendChild(a);

      // Try multiple click methods for WebKit compatibility
      try {
        // Method 1: Direct click
        a.click();
      } catch (e) {
        try {
          // Method 2: Dispatch click event
          const clickEvent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          });
          a.dispatchEvent(clickEvent);
        } catch (e2) {
          try {
            // Method 3: Use window.open as fallback
            window.open(url, '_blank');
          } catch (e3) {
            // Method 4: Copy to clipboard
            navigator.clipboard.writeText(jsonString).then(() => {
              alert(t("Download blocked. Data copied to clipboard instead. Please paste and save manually."));
            }).catch(() => {
              alert(t("Export failed. Please use Manual Export instead."));
            });
          }
        }
      }

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      alert(t("Failed to export data. Please use Manual Export instead."));
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (currentWorkspace) {
          await db.importData(importedData, currentWorkspace.id);
          alert(t("Data imported successfully! Please refresh the page."));
          window.location.reload();
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert(t("Failed to import data. Please ensure the file is a valid backup."));
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = async () => {
    try {
      // For WebKit packaged apps, window.confirm might not work properly
      // Use a simple prompt or direct action with warning
      const userInput = prompt(t("Type 'DELETE' to confirm deletion of all data. This action cannot be undone:"));
      if (userInput === 'DELETE') {
        await db.clearAllStores();
        alert(t("All data deleted successfully! Please refresh the page."));
        // Use setTimeout to ensure alert is shown before reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (userInput !== null) {
        alert(t("Deletion cancelled. Please type 'DELETE' exactly to confirm."));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(t("Failed to delete data. Please try again."));
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="border-b bg-background/95 dark:bg-black border-black/5 dark:border-white/5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-2 flex h-20 items-center justify-between">
          <div>
            <h1 className="text-md font-normal  text-[#737373] dark:text-[#E8E7EA]">{t("Settings")}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overflowScrolling: 'touch' }}>
        <div className="px-6 py-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="flex flex-wrap bg-transparent border-b border-gray-100 dark:border-white/10 rounded-none h-auto p-0 mb-6 gap-4 justify-start">
              <TabsTrigger
                value="general"
                className="inline-flex items-center gap-2 px-2 py-2 border-b-2 border-transparent text-[#737373] dark:text-[#9E9E9E] dark:data-[state=active]:border-white dark:data-[state=active]:text-white text-sm data-[state=active]:border-black data-[state=active]:text-black"
              >
                <Leaf className="w-4 h-4" />
                {t("General")}
              </TabsTrigger>
              <TabsTrigger
                value="statuses"
                className="inline-flex items-center gap-2 px-2 py-2 border-b-2 border-transparent text-[#737373] dark:text-[#9E9E9E] dark:data-[state=active]:border-white dark:data-[state=active]:text-white text-sm data-[state=active]:border-black data-[state=active]:text-black"
              >
                <Activity className="w-4 h-4" />
                {t("Statuses")}
              </TabsTrigger>
              <TabsTrigger
                value="tags"
                className="inline-flex items-center gap-2 px-2 py-2 border-b-2 border-transparent text-[#737373] dark:text-[#9E9E9E] dark:data-[state=active]:border-white dark:data-[state=active]:text-white text-sm data-[state=active]:border-black data-[state=active]:text-black"
              >
                <Bookmark className="w-4 h-4" />
                {t("Tags")}
              </TabsTrigger>
              <TabsTrigger
                value="priorities"
                className="inline-flex items-center gap-2 px-2 py-2 border-b-2 border-transparent text-[#737373] dark:text-[#9E9E9E] dark:data-[state=active]:border-white dark:data-[state=active]:text-white text-sm data-[state=active]:border-black data-[state=active]:text-black"
              >
                <Flame className="w-4 h-4" />
                {t("Priorities")}
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="inline-flex items-center gap-2 px-2 py-2 border-b-2 border-transparent text-[#737373] dark:text-[#9E9E9E] dark:data-[state=active]:border-white dark:data-[state=active]:text-white text-sm data-[state=active]:border-black data-[state=active]:text-black"
              >
                <Database className="w-4 h-4" />
                {t("Data")}
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* 3-Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* App Icon */}
                    <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                       <h3 className=" text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-2">{t("Workspace Icon")}</h3>
                      <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Upload a custom icon to replace the default icon in the sidebar.")}</p>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 border border-gray-700 bg-black/10 dark:bg-[#090909] dark:border-[#262626] flex items-center justify-center overflow-hidden rounded-full">
                          {appIcon ? (
                            <img src={appIcon} alt="App icon" className="w-full h-full object-cover" />
                          ) : (
                            <Fan className="w-5 h-5 text-[#737373] dark:text-[#9E9E9E]" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={setAppIcon}
                            className="hidden"
                            id="icon-upload"
                          />
                          <label htmlFor="icon-upload">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="border-gray-700   dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626]"
                              asChild
                            >
                              <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                {t("Upload")}
                              </span>
                            </Button>
                          </label>
                          {appIcon && appIcon !== "/logo.webp" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAppIcon(null)
                              }}
                              className="text-red-500 hover:text-red-500 dark:text-red-500 dark:hover:text-red-500 text-sm ml-2 bg-black/5 dark:bg-black dark:hover:bg-black"
                            >
                              {t("Remove")}
                            </Button>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* App Name */}
                    <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                       <h3 className=" text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-2">{t("Workspace Name")}</h3>
                      <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Change the name displayed in the sidebar.")}</p>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder={t("Enter app name")}
                        className=" border-black/5 text-black dark:text-white/90 h-9 text-sm bg-black/5 dark:bg-black dark:border-[#262626]"
                      />
                    </div>

                    {/* Timezone */}
                    <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                      <h3 className=" text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-2">{t("Timezone")}</h3>
                      <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Set your preferred timezone for date and time display.")}</p>
                      <Select value={timezone} onValueChange={(value) => {
                        if (value === 'auto') {
                          setTimezone(getBrowserTimezone());
                        } else {
                          setTimezone(value);
                        }
                      }}>
                        <SelectTrigger className="border-black/10 text-black dark:text-white/90 h-9 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                          {allTimezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}
                              className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Language - Single column below with same width as grid columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA] border-black/5 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                      <h3 className="text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-2">{t("Language")}</h3>
                      <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Choose your preferred language for the interface.")}</p>
                      <Select value={language} onValueChange={async (value) => { await setLanguage(value as LanguageKey); }}>
                        <SelectTrigger className="border-black/10 text-black dark:text-white/90 h-9 text-sm bg-black/5 dark:bg-black dark:border-[#262626]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black/90 rounded-lg border-black/10 dark:border-white/10">
                          <SelectItem value="en" className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#000]">
                            {t("English")}
                          </SelectItem>
                          <SelectItem value="es" className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#444444]">
                            {t("Spanish")}
                          </SelectItem>
                          <SelectItem value="de" className="text-black dark:text-white bg-white dark:bg-black hover:bg-[#f0f0f0] dark:hover:bg-[#444444]">
                            {t("German")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Statuses Tab */}
            <TabsContent value="statuses" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-3">
                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination) return

                      const newStatuses = Array.from(statuses)
                      const [reorderedItem] = newStatuses.splice(result.source.index, 1)
                      newStatuses.splice(result.destination.index, 0, reorderedItem)

                      onStatusReorder(newStatuses)
                    }}
                  >
                    <Droppable droppableId="statuses">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {statuses.map((status, index) => (
                            <Draggable key={status.id} draggableId={status.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center justify-between gap-4 py-2 px-4 rounded-lg cursor-pointer transition-colors group  text-[#737373] bg-black/5 dark:bg-[#090909] hover:text-black dark:hover:bg-white/5  dark:border-[#262626]/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <span {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                                    </span>
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                                    <span className="text-sm text-[#737373] dark:text-white/90 group-hover:text-[#737373] dark:text-[#E8E7EA] truncate">{status.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditingStatus(status)}
                                      className="text-[#737373] dark:text-[#9E9E9E] hover:text-black text-sm h-8"
                                    >
                                      <PencilLine className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onStatusDelete(status.id)}
                                      className="text-red-500 hover:text-red-500 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
            
                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <h3 className="text-sm font-medium text-[#737373] dark:text-[#E8E7EA] mb-3">
                    {editingStatus ? t("Edit Status") : t("Add New Status")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">Color</label>
                        <Input
                          type="color"
                          value={newStatusColor}
                          onChange={(e) => setNewStatusColor(e.target.value)}
                          className="w-9 h-9 p-0 border-0 cursor-pointer rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">{t("Name")}</label>
                        <Input
                          placeholder={t("Status name")}
                          value={newStatusName}
                          onChange={(e) => setNewStatusName(e.target.value)}
                          className=" text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626] h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleStatusSubmit}
                        size="sm"
                        className="dark:bg-white/90 dark:text-black dark:hover:bg-gray-300 text-sm text-white bg-black/80 hover:text-white hover:bg-black"
                      >
                        {editingStatus ? t("Update") : t("Add")}
                      </Button>
                      {editingStatus && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStatus(null)}
                          className="text-[#737373] hover:bg-black/10 hover:text-black dark:text-[#9E9E9E] text-sm"
                        >
                          {t("Cancel")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>


            {/* Tags Tab */}
            <TabsContent value="tags" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between gap-4 py-2 px-4 rounded-lg cursor-pointer transition-colors group  text-[#737373] bg-black/5 dark:bg-[#090909] hover:text-black dark:hover:bg-white/5  dark:border-[#262626]/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm text-[#737373] dark:text-white/90 group-hover:text-[#737373] dark:text-[#E8E7EA]">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingTag(tag)}
                          className="text-[#737373] hover:bg-black/10 hover:text-black dark:text-[#9E9E9E] text-sm"
                        >
                          <PencilLine className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTagDelete(tag.id)}
                          className="text-red-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <h3 className="text-sm font-medium text-[#737373] dark:text-[#E8E7EA] mb-3">{editingTag ? t("Edit Tag") : t("Add New Tag")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">{t("Color")}</label>
                        <Input
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="w-8 h-8 p-0 border-0 cursor-pointer  rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">{t("Name")}</label>
                        <Input
                          placeholder={t("Tag name")}
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className=" text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626] h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleTagSubmit} size="sm"                        
                        className="dark:bg-white/90 dark:text-black dark:hover:bg-gray-300 text-sm text-white bg-black/80 hover:text-white hover:bg-black"
                        >
                        {editingTag ? t("Update") : t("Add")}
                      </Button>
                      {editingTag && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTag(null)}
                          className="text-[#737373] hover:bg-black/10 hover:text-black dark:text-[#9E9E9E] text-sm"
                        >
                          {t("Cancel")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Priorities Tab */}
            <TabsContent value="priorities" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-3">
                  {priorities.map((priority) => (
                    <div
                      key={priority.id}
                      className="flex items-center justify-between gap-4 py-2 px-4 rounded-lg cursor-pointer transition-colors group  text-[#737373] bg-black/5 dark:bg-[#090909] hover:text-black dark:hover:bg-white/5  dark:border-[#262626]/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                        <span className="text-sm text-[#737373] dark:text-white/90 group-hover:text-[#737373] dark:text-[#E8E7EA]">{priority.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingPriority(priority)}
                          className="text-[#737373] hover:bg-black/10 hover:text-black dark:text-[#9E9E9E] text-sm"
                        >
                          <PencilLine className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPriorityDelete(priority.id)}
                          className="text-red-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
            
                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <h3 className="text-sm font-medium text-[#737373] dark:text-[#E8E7EA] mb-3">
                    {editingPriority ? t("Edit Priority") : t("Add New Priority")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">{t("Color")}</label>
                        <Input
                          type="color"
                          value={newPriorityColor}
                          onChange={(e) => setNewPriorityColor(e.target.value)}
                          className="w-8 h-8 p-0 border-0 cursor-pointer  rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#737373] dark:text-[#9E9E9E] mb-2">{t("Name")}</label>
                        <Input
                          placeholder={t("Priority name")}
                          value={newPriorityName}
                          onChange={(e) => setNewPriorityName(e.target.value)}
                          className=" text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626] h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handlePrioritySubmit}
                        size="sm"
                        className="dark:bg-white/90 dark:text-black dark:hover:bg-gray-300 text-sm text-white bg-black/80 hover:text-white hover:bg-black"
                        >
                        {editingPriority ? t("Update") : t("Add")}
                      </Button>
                      {editingPriority && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPriority(null)}
                          className="text-[#737373] dark:text-[#9E9E9E] text-sm"
                        >
                          {t("Cancel")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                    <h3 className=" text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-1">{t("Backup")}</h3>
                    <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Download all your tasks, statuses, and tags as JSON.")}</p>
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         className=" dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626] border-none"
                         onClick={handleExportData}
                       >
                         {t("Export Data")}
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         className=" dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626] border-none"
                         onClick={async () => {
                           try {
                             const data = await db.exportData();
                             setExportData(JSON.stringify(data, null, 2));
                             setShowManualExport(true);
                           } catch (error) {
                             console.error("Failed to load export data:", error);
                             alert(t("Failed to load data for manual export."));
                           }
                         }}
                       >
                         {t("Manual Export")}
                       </Button>
                     </div>
                  </div>
            
                  <div className="p-4 rounded-lg border text-[#737373] dark:text-[#E8E7EA] border-black/10 bg-black/5 dark:bg-[#090909] dark:border-[#262626]">
                    <h3 className=" text-[#737373] dark:text-[#E8E7EA] text-sm font-medium mb-1">{t("Restore")}</h3>
                    <p className="text-[#737373] dark:text-[#9E9E9E] text-xs mb-3">{t("Upload a backup to restore data. This will delete existing data.")}</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-data-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className=" dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626] border-none"
                      onClick={() => document.getElementById("import-data-input")?.click()}
                    >
                      {t("Import Data")}
                    </Button>
                  </div>
            
                  <div className="p-4 rounded-lg border dark:border-red-700 dark:bg-red-900/30 border-red-500 bg-red-500/20 transition-colors">
                    <h3 className="text-red-500 text-sm font-medium mb-1">{t("Danger Zone")}</h3>
                    <p className="text-red-500 text-xs mb-3">
                      {t("Permanently delete all your data. This action cannot be undone.")}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-sm dark:bg-red-600/90"
                      onClick={handleDeleteAllData}
                    >
                      {t("Delete All Data")}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Manual Export Dialog */}
      {showManualExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#090909] border border-black/10 dark:border-[#262626] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-[#737373] dark:text-[#E8E7EA]">{t("Manual Export")}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualExport(false)}
                className="text-[#737373] dark:text-[#9E9E9E] hover:text-black dark:hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-auto mb-4" style={{ WebkitOverflowScrolling: 'touch', overflowScrolling: 'touch' }}>
              <textarea
                value={exportData}
                readOnly
                className="w-full h-96 p-3 border border-black/10 dark:border-[#262626] rounded-md bg-black/5 dark:bg-black text-sm font-mono text-[#737373] dark:text-[#E8E7EA]"
                placeholder={t("Loading data...")}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(exportData).then(() => {
                    alert(t("Data copied to clipboard!"));
                  }).catch(() => {
                    alert(t("Failed to copy to clipboard."));
                  });
                }}
                className="dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626] border-none"
              >
                {t("Copy to Clipboard")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualExport(false)}
                className="dark:text-[#E8E7EA] bg-black/5 text-black/90 hover:text-black/90 text-sm cursor-pointer dark:bg-black dark:border-[#262626] border-none"
              >
                {t("Close")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}