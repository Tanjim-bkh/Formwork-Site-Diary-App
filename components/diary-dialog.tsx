"use client"

import { format } from "date-fns"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileEdit,
  Plus,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { DiaryEntry } from "@/lib/diary-data"

export type DiaryDialogMode = "diary" | "lostHours" | "incident" | "employees"

type DiaryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: DiaryEntry | null
  date: Date | undefined
  mode: DiaryDialogMode
  onCreateDiary?: () => void
}

type Severity = NonNullable<DiaryEntry["incident"]>["severity"]

// Radix ScrollArea only scrolls when its viewport has a bounded height
const BODY_SCROLL = "[&>[data-slot=scroll-area-viewport]]:max-h-[60vh]"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// Shared with the calendar grid so incident colours match everywhere
export function severityBadgeProps(severity: Severity): {
  variant?: "destructive" | "outline"
  className?: string
} {
  if (severity === "high") return { variant: "destructive" }
  if (severity === "medium") {
    return { className: "bg-orange-100 text-orange-800 hover:bg-orange-100" }
  }
  return { variant: "outline" }
}

const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge {...severityBadgeProps(severity)}>{SEVERITY_LABEL[severity]}</Badge>
  )
}

function EmptyState({
  title,
  onCreateDiary,
}: {
  title: string
  onCreateDiary?: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Formwork Site Diary</DialogDescription>
      </DialogHeader>
      <Card>
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <ClipboardList size={40} className="text-muted-foreground" />
          <span className="font-medium">No diary entry</span>
          <span className="text-sm text-muted-foreground">
            No diary has been submitted for this day.
          </span>
          <Button className="mt-2" onClick={() => onCreateDiary?.()}>
            <Plus />
            Create diary
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

function DiaryView({
  entry,
  title,
  onClose,
}: {
  entry: DiaryEntry
  title: string
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Site diary</DialogDescription>
      </DialogHeader>

      <ScrollArea className={BODY_SCROLL}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              {entry.status === "submitted" ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 />
                  Submitted
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <FileEdit />
                  Draft
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{initials(entry.submittedBy)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm">{entry.submittedBy}</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.submittedAt}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} />
                <span>{entry.employees.total} workers on site</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} />
                {entry.lostHours ? (
                  <span>
                    {entry.lostHours.total} hrs lost — {entry.lostHours.reason}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No lost hours</span>
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle size={14} />
                {entry.incident ? (
                  <>
                    <span>{entry.incident.title}</span>
                    <SeverityBadge severity={entry.incident.severity} />
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    No incidents reported
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button>
          <FileEdit />
          Edit diary
        </Button>
      </DialogFooter>
    </>
  )
}

function EmployeesView({
  entry,
  dateLabel,
}: {
  entry: DiaryEntry
  dateLabel: string
}) {
  const { total, workers } = entry.employees

  return (
    <>
      <DialogHeader>
        <DialogTitle>Employees — {dateLabel}</DialogTitle>
        <DialogDescription>{total} workers on site</DialogDescription>
      </DialogHeader>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">{total}</span>
        <span className="text-sm text-muted-foreground">workers today</span>
      </div>

      <ScrollArea className={BODY_SCROLL}>
        <div className="flex flex-col pr-3">
          {workers.map((worker, i) => (
            <div key={worker.name} className="flex flex-col">
              {i > 0 && <Separator />}
              <div className="flex items-center gap-3 py-2">
                <Avatar>
                  <AvatarFallback>{initials(worker.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{worker.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {worker.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  )
}

function LostHoursView({
  entry,
  dateLabel,
}: {
  entry: DiaryEntry
  dateLabel: string
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Lost hours — {dateLabel}</DialogTitle>
        <DialogDescription>Time lost on site</DialogDescription>
      </DialogHeader>

      <span className="text-4xl font-bold text-orange-600">
        {entry.lostHours?.total ?? 0} hrs
      </span>

      <Card>
        <CardContent className="flex items-center gap-2 text-sm">
          <Clock size={14} />
          <span>{entry.lostHours?.reason ?? "No lost hours recorded."}</span>
        </CardContent>
      </Card>

      <span className="text-xs text-muted-foreground">
        Lost hours reduce billable time for this project.
      </span>
    </>
  )
}

function IncidentView({
  entry,
  dateLabel,
}: {
  entry: DiaryEntry
  dateLabel: string
}) {
  const { incident } = entry

  return (
    <>
      <DialogHeader>
        <DialogTitle>Incident report — {dateLabel}</DialogTitle>
        <DialogDescription className="flex items-center gap-2">
          {incident ? (
            <>
              Severity <SeverityBadge severity={incident.severity} />
            </>
          ) : (
            "No incident reported"
          )}
        </DialogDescription>
      </DialogHeader>

      {incident && (
        <>
          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={14} />
                {incident.title}
              </CardTitle>
              <SeverityBadge severity={incident.severity} />
            </CardHeader>
            <CardContent>
              <span className="text-sm">{incident.description}</span>
            </CardContent>
          </Card>

          <span className="text-xs text-muted-foreground">
            This incident has been logged. Ensure a formal report is submitted
            within 24 hours.
          </span>
        </>
      )}
    </>
  )
}

export default function DiaryDialog({
  open,
  onOpenChange,
  entry,
  date,
  mode,
  onCreateDiary,
}: DiaryDialogProps) {
  const longDate = date ? format(date, "EEEE, d MMMM yyyy") : "Select a day"
  const shortDate = date ? format(date, "d MMMM yyyy") : "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[680px]">
        {entry === null ? (
          <EmptyState title={longDate} onCreateDiary={onCreateDiary} />
        ) : mode === "employees" ? (
          <EmployeesView entry={entry} dateLabel={shortDate} />
        ) : mode === "lostHours" ? (
          <LostHoursView entry={entry} dateLabel={shortDate} />
        ) : mode === "incident" ? (
          <IncidentView entry={entry} dateLabel={shortDate} />
        ) : (
          <DiaryView
            entry={entry}
            title={longDate}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
