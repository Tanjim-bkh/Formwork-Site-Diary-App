"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import {
  addMonths,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isWeekend,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import {
  AlertTriangle,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  Users,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import AppSidebar from "@/components/app-sidebar"
import CreateDiaryDialog from "@/components/create-diary-dialog"
import DiaryDialog, {
  severityBadgeProps,
  type DiaryDialogMode,
} from "@/components/diary-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DIARY_DATA, type DiaryEntry } from "@/lib/diary-data"
import { DEFAULT_PROJECT, type Project } from "@/lib/project-data"
import { cn } from "@/lib/utils"

type Filters = {
  diaries: boolean
  lostHours: boolean
  incidents: boolean
  employees: boolean
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Week rows share the viewport height left after the fixed chrome:
// top bar (14) + grid padding (8) + header row (10) + one gap-1 per week row.
// Grids longer than 6 weeks reuse the 6-week height and scroll.
// Full class strings so Tailwind can detect them.
const WEEK_ROW_HEIGHT: Record<number, string> = {
  1: "min-h-[calc((100vh_-_--spacing(33))/1)]",
  2: "min-h-[calc((100vh_-_--spacing(34))/2)]",
  3: "min-h-[calc((100vh_-_--spacing(35))/3)]",
  4: "min-h-[calc((100vh_-_--spacing(36))/4)]",
  5: "min-h-[calc((100vh_-_--spacing(37))/5)]",
  6: "min-h-[calc((100vh_-_--spacing(38))/6)]",
}

// Same, plus the "select a range" banner: py-2 (4) + text-sm line (5)
const WEEK_ROW_HEIGHT_WITH_BANNER: Record<number, string> = {
  4: "min-h-[calc((100vh_-_--spacing(45))/4)]",
  5: "min-h-[calc((100vh_-_--spacing(46))/5)]",
  6: "min-h-[calc((100vh_-_--spacing(47))/6)]",
}

const noopSubscribe = () => () => {}

// The page is prerendered at build time, so "today" must come from the
// browser. The server snapshot is null, so hydration never sees a stale date.
function useTodayKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => format(new Date(), "yyyy-MM-dd"),
    () => null
  )
}

// Monday-to-Sunday weeks covering start..end; days outside it become null
// padding cells. Month view passes the month's first and last day.
function buildCalendarGrid(start: Date, end: Date): (Date | null)[][] {
  const cells = eachDayOfInterval({
    start: startOfWeek(start, { weekStartsOn: 1 }),
    end: endOfWeek(end, { weekStartsOn: 1 }),
  }).map((day) => (isWithinInterval(day, { start, end }) ? day : null))

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

function getDaysToRender(
  viewMode: "month" | "range",
  dateRange: DateRange,
  currentMonth: Date
) {
  const { from, to } = dateRange
  // Range not picked yet: show the month with a prompt banner
  const banner = viewMode === "range" && (!from || !to)

  const weeks =
    viewMode === "range" && from && to
      ? buildCalendarGrid(from, to)
      : buildCalendarGrid(startOfMonth(currentMonth), endOfMonth(currentMonth))

  const heights = banner ? WEEK_ROW_HEIGHT_WITH_BANNER : WEEK_ROW_HEIGHT
  return { weeks, banner, rowHeight: heights[Math.min(weeks.length, 6)] }
}

const PILL = "h-6 max-w-full justify-start gap-1 px-1.5 text-[11px]"

type Pill = { key: DiaryDialogMode; badge: ReactNode; tooltip: string }

function getEntryPills(entry: DiaryEntry, filters: Filters) {
  const pills: Pill[] = []

  if (filters.diaries) {
    pills.push({
      key: "diary",
      tooltip: `${entry.status === "draft" ? "Draft saved" : "Submitted"} by ${entry.submittedBy} at ${entry.submittedAt}`,
      badge: (
        <Badge
          className={cn(
            PILL,
            "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100"
          )}
        >
          <ClipboardList className="size-3" />
          <span className="truncate">Site diary</span>
        </Badge>
      ),
    })
  }

  if (filters.lostHours && entry.lostHours) {
    pills.push({
      key: "lostHours",
      tooltip: entry.lostHours.reason,
      badge: (
        <Badge
          className={cn(
            PILL,
            "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-100"
          )}
        >
          <Clock className="size-3" />
          <span className="truncate">{entry.lostHours.total} hrs lost</span>
        </Badge>
      ),
    })
  }

  if (filters.incidents && entry.incident) {
    const severity = severityBadgeProps(entry.incident.severity)
    pills.push({
      key: "incident",
      tooltip: entry.incident.title,
      badge: (
        <Badge
          variant={severity.variant}
          className={cn(PILL, severity.className)}
        >
          <AlertTriangle className="size-3" />
          <span className="truncate">{entry.incident.severity} incident</span>
        </Badge>
      ),
    })
  }

  if (filters.employees) {
    pills.push({
      key: "employees",
      tooltip: `${entry.employees.total} on site`,
      badge: (
        <Badge
          className={cn(
            PILL,
            "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
          )}
        >
          <Users className="size-3" />
          <span className="truncate">{entry.employees.total} employees</span>
        </Badge>
      ),
    })
  }

  return pills
}

// Clickable badge pills, shared by the grid and the long-range list
function PillButtons({
  pills,
  onOpen,
  className,
}: {
  pills: Pill[]
  onOpen: (mode: DiaryDialogMode) => void
  className?: string
}) {
  return pills.map((pill) => (
    <Tooltip key={pill.key}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto justify-start p-0", className)}
          onClick={() => onOpen(pill.key)}
        >
          {pill.badge}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{pill.tooltip}</TooltipContent>
    </Tooltip>
  ))
}

function rangeTriggerLabel({ from, to }: DateRange) {
  if (from && to) return `${format(from, "d MMM")} → ${format(to, "d MMM yyyy")}`
  if (from) return `${format(from, "d MMM")} → Pick end`
  return "Select range"
}

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1))
  const [filters, setFilters] = useState<Filters>({
    diaries: true,
    lostHours: true,
    incidents: true,
    employees: true,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogEntry, setDialogEntry] = useState<DiaryEntry | null>(null)
  const [dialogDate, setDialogDate] = useState<Date | undefined>(undefined)
  const [dialogMode, setDialogMode] = useState<DiaryDialogMode>("diary")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogDate, setCreateDialogDate] = useState<Date>(new Date())
  const [selectedProject, setSelectedProject] =
    useState<Project>(DEFAULT_PROJECT)
  const [viewMode, setViewMode] = useState<"month" | "range">("month")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })
  const [rangePopoverOpen, setRangePopoverOpen] = useState(false)

  const todayKey = useTodayKey()
  const plan = getDaysToRender(viewMode, dateRange, currentMonth)
  const rangeComplete = !!dateRange.from && !!dateRange.to

  function handleFilterChange(key: keyof Filters, value: boolean) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearRange() {
    setDateRange({ from: undefined, to: undefined })
    setRangePopoverOpen(false)
  }

  function handleViewModeChange(value: string) {
    // Radix sends "" when the active item is clicked again; keep the current view
    if (value !== "month" && value !== "range") return
    setViewMode(value)
    if (value === "range") setRangePopoverOpen(true)
    else clearRange()
  }

  function findEntry(date: Date) {
    return DIARY_DATA.find((e) => e.date === format(date, "yyyy-MM-dd"))
  }

  function openDialog(
    date: Date,
    entry: DiaryEntry | undefined,
    mode: DiaryDialogMode
  ) {
    setDialogEntry(entry ?? null)
    setDialogDate(date)
    setDialogMode(mode)
    setDialogOpen(true)
  }

  function renderGrid(weeks: (Date | null)[][], rowHeight: string) {
    return (
      <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 p-4">
        <div className="flex h-10 items-end border-b pb-1 text-xs text-muted-foreground">
          Wk
        </div>
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="flex h-10 items-end border-b pb-1 text-xs text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {weeks.map((week, weekIndex) => {
          const firstDay = week.find((d): d is Date => d !== null)
          return [
            <div
              key={`wk-${weekIndex}`}
              className="pt-1.5 text-xs text-muted-foreground"
            >
              {firstDay ? getISOWeek(firstDay) : ""}
            </div>,
            ...week.map((date, dayIndex) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${weekIndex}-${dayIndex}`}
                    className={cn(rowHeight, "rounded-md bg-muted/30")}
                  />
                )
              }

              const entry = findEntry(date)
              const pills = entry ? getEntryPills(entry, filters) : []
              const today = format(date, "yyyy-MM-dd") === todayKey

              const isInRange =
                viewMode === "range" && dateRange.from && dateRange.to
                  ? isWithinInterval(date, {
                      start: dateRange.from,
                      end: dateRange.to,
                    })
                  : false
              const isRangeStart = dateRange.from
                ? isSameDay(date, dateRange.from)
                : false
              const isRangeEnd = dateRange.to
                ? isSameDay(date, dateRange.to)
                : false

              return (
                <Card
                  key={date.toISOString()}
                  className={cn(
                    rowHeight,
                    "flex flex-col gap-0 py-0",
                    !isInRange && isWeekend(date) && "bg-muted/30",
                    isInRange && "border-primary/20 bg-primary/5",
                    isRangeStart && "rounded-l-md border-l-2 border-l-primary",
                    isRangeEnd && "rounded-r-md border-r-2 border-r-primary",
                    isRangeStart && isRangeEnd && "border-2 border-primary",
                    today && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="flex flex-col items-start gap-1 p-1.5">
                    <Button
                      variant="ghost"
                      className="h-auto p-0"
                      aria-label={format(date, "EEEE d MMMM yyyy")}
                      onClick={() => openDialog(date, entry, "diary")}
                    >
                      <Badge variant={today ? "default" : "outline"}>
                        {format(date, "d")}
                      </Badge>
                    </Button>
                    <PillButtons
                      pills={pills}
                      className="max-w-full"
                      onOpen={(mode) => openDialog(date, entry, mode)}
                    />
                  </CardContent>
                </Card>
              )
            }),
          ]
        })}
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-none items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4"
          />
          <h1 className="text-xl font-semibold">Calendar</h1>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-6"
          />
          <div className="flex min-w-0 items-center">
            <span className="max-w-xs truncate text-sm font-medium">
              {selectedProject.name}
            </span>
            <Badge variant="outline" className="ml-1.5 text-xs">
              {selectedProject.code}
            </Badge>
            <span className="ml-2 hidden text-xs text-muted-foreground lg:block">
              {selectedProject.location}
            </span>
          </div>
          <div className="flex-1" />
          {viewMode === "month" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft />
              </Button>
              <span className="w-32 text-center text-sm font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight />
              </Button>
              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-4"
              />
            </>
          )}
          {viewMode === "range" && dateRange.from && dateRange.to && (
            <>
              <span className="text-sm font-medium">
                {format(dateRange.from, "d MMM")} —{" "}
                {format(dateRange.to, "d MMM yyyy")}
              </span>
              <Button variant="ghost" size="sm" onClick={clearRange}>
                Clear range
              </Button>
              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-4"
              />
            </>
          )}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
            <ToggleGroupItem value="range">Date range</ToggleGroupItem>
          </ToggleGroup>
          {viewMode === "range" && (
            <Popover open={rangePopoverOpen} onOpenChange={setRangePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon />
                  {rangeTriggerLabel(dateRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) =>
                    setDateRange({ from: range?.from, to: range?.to })
                  }
                  numberOfMonths={2}
                  defaultMonth={dateRange.from ?? subMonths(new Date(), 1)}
                  disabled={{ after: new Date() }}
                  autoFocus
                />
                <div className="flex items-center justify-between gap-3 border-t p-3">
                  <span className="text-sm text-muted-foreground">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "d MMM yyyy")} – ${format(dateRange.to, "d MMM yyyy")} · ${differenceInDays(dateRange.to, dateRange.from) + 1} days`
                      : "Select a start and end date"}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearRange}>
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      disabled={!rangeComplete}
                      onClick={() => setRangePopoverOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button
            size="sm"
            onClick={() => {
              setCreateDialogDate(new Date())
              setCreateDialogOpen(true)
            }}
          >
            <Plus />
            New diary
          </Button>
        </header>

        {plan.banner && (
          <div className="flex-none bg-muted/50 py-2 text-center text-sm text-muted-foreground">
            Select a start and end date to filter the calendar
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          {renderGrid(plan.weeks, plan.rowHeight)}
        </ScrollArea>
      </SidebarInset>
      <DiaryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={dialogEntry}
        date={dialogDate}
        mode={dialogMode}
        onCreateDiary={() => {
          setDialogOpen(false)
          setCreateDialogDate(dialogDate ?? new Date())
          setCreateDialogOpen(true)
        }}
      />
      <CreateDiaryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultDate={createDialogDate}
      />
    </div>
  )
}
