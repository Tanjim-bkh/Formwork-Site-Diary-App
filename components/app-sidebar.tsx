"use client"

import { useEffect, useRef } from "react"
import {
  AlertTriangle,
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { PROJECTS, type Project } from "@/lib/project-data"
import { cn } from "@/lib/utils"

// Hides content that doesn't fit the icon-only rail
const HIDE_WHEN_COLLAPSED = "group-data-[collapsible=icon]:hidden"

// Below this width the desktop sidebar collapses to icons.
// Under 768px shadcn already swaps it for an off-canvas sheet.
const COLLAPSE_QUERY = "(max-width: 1023px)"

type Filters = {
  diaries: boolean
  lostHours: boolean
  incidents: boolean
  employees: boolean
}

type AppSidebarProps = {
  filters: Filters
  onFilterChange: (key: keyof Filters, value: boolean) => void
  selectedProject: Project
  onProjectChange: (project: Project) => void
}

type NavItem = {
  title: string
  icon: LucideIcon
  isActive?: boolean
  badge?: { count: string; variant: "secondary" | "destructive" }
}

const navItems: NavItem[] = [
  { title: "Calendar", icon: LayoutDashboard, isActive: true },
  {
    title: "Site diaries",
    icon: ClipboardList,
    badge: { count: "3", variant: "secondary" },
  },
  { title: "Employees", icon: Users },
  {
    title: "Incidents",
    icon: AlertTriangle,
    badge: { count: "1", variant: "destructive" },
  },
  { title: "Reports", icon: BarChart2 },
  { title: "Settings", icon: Settings },
]

const filterItems: { key: keyof Filters; label: string; dot: string }[] = [
  { key: "diaries", label: "Site diaries", dot: "bg-blue-500" },
  { key: "lostHours", label: "Lost hours", dot: "bg-orange-500" },
  { key: "incidents", label: "Incidents", dot: "bg-red-500" },
  { key: "employees", label: "Employees", dot: "bg-green-500" },
]

export default function AppSidebar({
  filters,
  onFilterChange,
  selectedProject,
  onProjectChange,
}: AppSidebarProps) {
  const { setOpen } = useSidebar()
  // setOpen changes identity whenever the sidebar toggles; a ref keeps the
  // media listener from re-running and undoing a manual expand/collapse
  const setOpenRef = useRef(setOpen)
  useEffect(() => {
    setOpenRef.current = setOpen
  }, [setOpen])

  useEffect(() => {
    const mql = window.matchMedia(COLLAPSE_QUERY)
    const sync = () => setOpenRef.current(!mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-1 p-2">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="shrink-0" />
            <span className={cn("font-medium", HIDE_WHEN_COLLAPSED)}>
              Site Diary
            </span>
          </div>
          <span
            className={cn("text-xs text-muted-foreground", HIDE_WHEN_COLLAPSED)}
          >
            BKH Group — Formwork
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge.variant}
                        className={cn("ml-auto", HIDE_WHEN_COLLAPSED)}
                      >
                        {item.badge.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={HIDE_WHEN_COLLAPSED}>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <Select
              value={selectedProject.id}
              onValueChange={(id) => {
                const project = PROJECTS.find((p) => p.id === id)
                if (project) onProjectChange(project)
              }}
            >
              <SelectTrigger className="w-full">
                {/* Explicit children keep the trigger to the name only;
                    otherwise Radix copies the two-line item content in */}
                <SelectValue>{selectedProject.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROJECTS.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex flex-col">
                      <span className="text-sm">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {project.code} · {project.location}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={HIDE_WHEN_COLLAPSED}>
          <SidebarGroupLabel>Filters</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-2 p-2">
              {filterItems.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-${item.key}`}
                    checked={filters[item.key]}
                    onCheckedChange={(checked) =>
                      onFilterChange(item.key, checked === true)
                    }
                  />
                  <Badge
                    aria-hidden
                    className={cn("h-2.5 w-2.5 rounded-sm p-0", item.dot)}
                  />
                  <label htmlFor={`filter-${item.key}`} className="text-sm">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
          <Avatar>
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col", HIDE_WHEN_COLLAPSED)}>
            <span className="text-sm font-medium">John Smith</span>
            <span className="text-xs text-muted-foreground">
              Site Supervisor
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
