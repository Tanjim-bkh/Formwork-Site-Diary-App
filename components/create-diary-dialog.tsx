"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type SlabRow = {
  id: string
  level: string // "Level 1" to "Level 5"
  pour: string // "Pour 1" to "Pour 5"
  description: string
}

type WallRow = {
  id: string
  label: string // free text, e.g. "Cores", "GF upstand", "Core 1 Stairs"
  description: string
}

type Activity = {
  id: string
  type: "slab" | "wall"
  // slab: multiple level+pour rows
  slabRows: SlabRow[]
  // wall: multiple named rows
  wallRows: WallRow[]
}

type CreateDiaryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date
}

const WEATHER_OPTIONS = ["Sunny", "Partly cloudy", "Overcast", "Rainy", "Windy"]
const LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]
const POURS = ["Pour 1", "Pour 2", "Pour 3", "Pour 4", "Pour 5"]

// Radix ScrollArea only scrolls when its viewport has a bounded height.
// 10rem ≈ the fixed header and footer around the form.
const FORM_SCROLL = "[&>[data-slot=scroll-area-viewport]]:max-h-[calc(90vh-10rem)]"

// crypto.randomUUID only exists in secure contexts (HTTPS or localhost), so
// fall back when the dev server is opened from a tablet over plain http
function newId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

const emptySlabRow = (): SlabRow => ({
  id: newId(),
  level: "",
  pour: "",
  description: "",
})

const emptyWallRow = (): WallRow => ({ id: newId(), label: "", description: "" })

const DELETE_BUTTON = "h-7 w-7 text-muted-foreground hover:text-destructive"
const ADD_ROW_BUTTON = "mt-2 w-full gap-1.5 border border-dashed text-muted-foreground"

export default function CreateDiaryDialog({
  open,
  onOpenChange,
  defaultDate,
}: CreateDiaryDialogProps) {
  const [date, setDate] = useState<Date>(defaultDate ?? new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [weather, setWeather] = useState("")
  const [activities, setActivities] = useState<Activity[]>([])
  const [siteIssues, setSiteIssues] = useState("")

  // Each time the dialog opens, start on the date it was opened for
  useEffect(() => {
    if (open) setDate(defaultDate ?? new Date())
  }, [open, defaultDate])

  function updateActivity(id: string, change: (a: Activity) => Activity) {
    setActivities((prev) => prev.map((a) => (a.id === id ? change(a) : a)))
  }

  function addActivity(type: "slab" | "wall") {
    setActivities((prev) => [
      ...prev,
      {
        id: newId(),
        type,
        slabRows: type === "slab" ? [emptySlabRow()] : [],
        wallRows: type === "wall" ? [emptyWallRow()] : [],
      },
    ])
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  function addSlabRow(activityId: string) {
    updateActivity(activityId, (a) => ({
      ...a,
      slabRows: [...a.slabRows, emptySlabRow()],
    }))
  }

  function removeSlabRow(activityId: string, rowId: string) {
    updateActivity(activityId, (a) => {
      const slabRows = a.slabRows.filter((r) => r.id !== rowId)
      // Always keep at least one row
      return { ...a, slabRows: slabRows.length ? slabRows : [emptySlabRow()] }
    })
  }

  function updateSlabRow(
    activityId: string,
    rowId: string,
    field: keyof SlabRow,
    value: string
  ) {
    updateActivity(activityId, (a) => ({
      ...a,
      slabRows: a.slabRows.map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r
      ),
    }))
  }

  function addWallRow(activityId: string) {
    updateActivity(activityId, (a) => ({
      ...a,
      wallRows: [...a.wallRows, emptyWallRow()],
    }))
  }

  function removeWallRow(activityId: string, rowId: string) {
    updateActivity(activityId, (a) => {
      const wallRows = a.wallRows.filter((r) => r.id !== rowId)
      // Always keep at least one row
      return { ...a, wallRows: wallRows.length ? wallRows : [emptyWallRow()] }
    })
  }

  function updateWallRow(
    activityId: string,
    rowId: string,
    field: keyof WallRow,
    value: string
  ) {
    updateActivity(activityId, (a) => ({
      ...a,
      wallRows: a.wallRows.map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r
      ),
    }))
  }

  // The date is reset by the open effect above
  function resetForm() {
    setWeather("")
    setActivities([])
    setSiteIssues("")
  }

  function handleSubmit() {
    console.log({ date, weather, activities, siteIssues })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[90vw] flex-col gap-0 p-0 sm:max-w-[660px]">
        <div className="border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle>New site diary</DialogTitle>
            <DialogDescription>
              {format(date, "EEEE, d MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className={`min-h-0 flex-1 ${FORM_SCROLL}`}>
          <div className="flex flex-col gap-6 px-6 py-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="diary-date">Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="diary-date"
                    variant="outline"
                    className="w-full justify-start gap-2 text-left font-normal"
                  >
                    <CalendarIcon size={16} />
                    {format(date, "EEEE, d MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d)
                        setDatePickerOpen(false)
                      }
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Weather */}
            <div className="flex flex-col gap-1.5">
              <Label>Weather</Label>
              <div className="flex flex-wrap gap-2">
                {WEATHER_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={weather === option ? "default" : "outline"}
                    size="sm"
                    aria-pressed={weather === option}
                    onClick={() => setWeather(weather === option ? "" : option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Activities</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => addActivity("slab")}
                  >
                    <Plus size={14} />
                    Add slab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => addActivity("wall")}
                  >
                    <Plus size={14} />
                    Add wall
                  </Button>
                </div>
              </div>

              {activities.map((activity, index) => (
                <Card key={activity.id} className="gap-0 py-0">
                  <CardHeader className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {activity.type === "slab" ? "Slab" : "Wall"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Activity {index + 1}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={DELETE_BUTTON}
                        aria-label={`Remove activity ${index + 1}`}
                        onClick={() => removeActivity(activity.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-0 px-4 pb-4">
                    {activity.type === "slab" ? (
                      <>
                        {activity.slabRows.map((slabRow, rowIndex) => (
                          <div key={slabRow.id}>
                            {rowIndex > 0 && <Separator className="my-3" />}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`${slabRow.id}-level`}
                                    className="mb-1 text-xs text-muted-foreground"
                                  >
                                    Level
                                  </Label>
                                  <Select
                                    value={slabRow.level}
                                    onValueChange={(v) =>
                                      updateSlabRow(
                                        activity.id,
                                        slabRow.id,
                                        "level",
                                        v
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id={`${slabRow.id}-level`}
                                      className="h-8 w-full text-sm"
                                    >
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {LEVELS.map((level) => (
                                        <SelectItem key={level} value={level}>
                                          {level}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`${slabRow.id}-pour`}
                                    className="mb-1 text-xs text-muted-foreground"
                                  >
                                    Pour
                                  </Label>
                                  <Select
                                    value={slabRow.pour}
                                    onValueChange={(v) =>
                                      updateSlabRow(
                                        activity.id,
                                        slabRow.id,
                                        "pour",
                                        v
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id={`${slabRow.id}-pour`}
                                      className="h-8 w-full text-sm"
                                    >
                                      <SelectValue placeholder="Select pour" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {POURS.map((pour) => (
                                        <SelectItem key={pour} value={pour}>
                                          {pour}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`${DELETE_BUTTON} mt-5 flex-none`}
                                  aria-label="Remove level and pour"
                                  onClick={() =>
                                    removeSlabRow(activity.id, slabRow.id)
                                  }
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Describe work for this level and pour..."
                                value={slabRow.description}
                                onChange={(e) =>
                                  updateSlabRow(
                                    activity.id,
                                    slabRow.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="min-h-[60px] resize-none text-sm"
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={ADD_ROW_BUTTON}
                          onClick={() => addSlabRow(activity.id)}
                        >
                          <Plus size={14} />
                          Add level & pour
                        </Button>
                      </>
                    ) : (
                      <>
                        {activity.wallRows.map((wallRow, rowIndex) => (
                          <div key={wallRow.id}>
                            {rowIndex > 0 && <Separator className="my-3" />}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`${wallRow.id}-label`}
                                    className="mb-1 text-xs text-muted-foreground"
                                  >
                                    Label
                                  </Label>
                                  <Input
                                    id={`${wallRow.id}-label`}
                                    placeholder="e.g. Cores, GF upstand, Core 1 Stairs..."
                                    value={wallRow.label}
                                    onChange={(e) =>
                                      updateWallRow(
                                        activity.id,
                                        wallRow.id,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`${DELETE_BUTTON} mt-5 flex-none`}
                                  aria-label="Remove wall item"
                                  onClick={() =>
                                    removeWallRow(activity.id, wallRow.id)
                                  }
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Describe wall activity..."
                                value={wallRow.description}
                                onChange={(e) =>
                                  updateWallRow(
                                    activity.id,
                                    wallRow.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="min-h-[60px] resize-none text-sm"
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={ADD_ROW_BUTTON}
                          onClick={() => addWallRow(activity.id)}
                        >
                          <Plus size={14} />
                          Add wall item
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Site issues */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-issues">Site issues</Label>
              <Textarea
                id="site-issues"
                placeholder="Describe any site issues, safety concerns, or blockers..."
                value={siteIssues}
                onChange={(e) => setSiteIssues(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save diary</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
