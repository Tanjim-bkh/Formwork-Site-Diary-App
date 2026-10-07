export type Project = {
  id: string
  name: string
  code: string // short code e.g. "FW-001"
  location: string // e.g. "Parramatta, NSW"
  status: "active" | "completed" | "on-hold"
}

export const PROJECTS: Project[] = [
  {
    id: "1",
    name: "Project A",
    code: "FW-001",
    location: "Parramatta, NSW",
    status: "active",
  },
  {
    id: "2",
    name: "Project B",
    code: "FW-002",
    location: "Barangaroo, NSW",
    status: "active",
  },
  {
    id: "3",
    name: "Project C",
    code: "FW-003",
    location: "Chatswood, NSW",
    status: "on-hold",
  },
  {
    id: "4",
    name: "Project D",
    code: "FW-004",
    location: "Sydney Olympic Park, NSW",
    status: "active",
  },
]

export const DEFAULT_PROJECT = PROJECTS[0]
