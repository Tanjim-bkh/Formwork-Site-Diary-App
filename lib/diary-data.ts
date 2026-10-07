export type DiaryEntry = {
  date: string // "YYYY-MM-DD"
  status: "submitted" | "draft"
  submittedBy: string
  submittedAt: string // e.g. "7:14 AM"
  employees: {
    total: number
    workers: { name: string; role: string }[]
  }
  lostHours?: {
    total: number
    reason: string
  }
  incident?: {
    title: string
    severity: "low" | "medium" | "high"
    description: string
  }
}

const CREW: { name: string; role: string }[] = [
  { name: "Liam Carter", role: "Formwork Carpenter" },
  { name: "Priya Nair", role: "Leading Hand" },
  { name: "Jack Thompson", role: "Formwork Carpenter" },
  { name: "Mitchell O'Brien", role: "Crane Operator" },
  { name: "Tane Wiremu", role: "Dogman" },
  { name: "Lachlan Murray", role: "Formwork Carpenter" },
  { name: "Sione Taufa", role: "Labourer" },
  { name: "Chloe Nguyen", role: "Steel Fixer" },
  { name: "Daniel Russo", role: "Concreter" },
  { name: "Brodie Kelly", role: "Apprentice Carpenter" },
  { name: "Ahmed Haddad", role: "Formwork Carpenter" },
  { name: "Josh Fitzgerald", role: "Rigger" },
  { name: "Ella Henderson", role: "WHS Officer" },
  { name: "Ravi Sharma", role: "Steel Fixer" },
  { name: "Tom Papadopoulos", role: "Labourer" },
]

function crew(count: number, offset: number) {
  const workers = Array.from(
    { length: count },
    (_, i) => CREW[(offset + i) % CREW.length]
  )
  return { total: workers.length, workers }
}

export const DIARY_DATA: DiaryEntry[] = [
  {
    date: "2026-10-01",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:14 AM",
    employees: crew(12, 0),
  },
  {
    date: "2026-10-02",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:05 AM",
    employees: crew(13, 1),
  },
  // Saturday shift
  {
    date: "2026-10-03",
    status: "submitted",
    submittedBy: "Priya Nair",
    submittedAt: "6:48 AM",
    employees: crew(10, 2),
    lostHours: { total: 4.5, reason: "Rain delay" },
  },
  {
    date: "2026-10-05",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:20 AM",
    employees: crew(14, 3),
  },
  {
    date: "2026-10-06",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:11 AM",
    employees: crew(13, 4),
    incident: {
      title: "Near miss — unsecured load",
      severity: "medium",
      description:
        "Load shifted during crane lift. No injuries. Reviewed with crew.",
    },
  },
  {
    date: "2026-10-07",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:02 AM",
    employees: crew(15, 5),
  },
  {
    date: "2026-10-08",
    status: "submitted",
    submittedBy: "Priya Nair",
    submittedAt: "7:26 AM",
    employees: crew(12, 6),
    lostHours: { total: 2, reason: "Equipment fault — concrete pump" },
  },
  {
    date: "2026-10-09",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:09 AM",
    employees: crew(11, 7),
  },
  {
    date: "2026-10-12",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:17 AM",
    employees: crew(14, 8),
  },
  {
    date: "2026-10-13",
    status: "draft",
    submittedBy: "John Smith",
    submittedAt: "4:42 PM",
    employees: crew(13, 9),
  },
  {
    date: "2026-10-14",
    status: "draft",
    submittedBy: "Priya Nair",
    submittedAt: "5:03 PM",
    employees: crew(12, 10),
  },
  {
    date: "2026-10-15",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "10:35 AM",
    employees: crew(14, 11),
    lostHours: { total: 6, reason: "Site shutdown — high winds" },
    incident: {
      title: "Wind event — site shutdown",
      severity: "high",
      description:
        "BOM wind warning exceeded safe working threshold. Site evacuated at 10:00 AM.",
    },
  },
  {
    date: "2026-10-16",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:08 AM",
    employees: crew(15, 12),
  },
  // Saturday shift
  {
    date: "2026-10-17",
    status: "submitted",
    submittedBy: "Priya Nair",
    submittedAt: "6:55 AM",
    employees: crew(10, 13),
    lostHours: { total: 3, reason: "Subcontractor delay" },
  },
  {
    date: "2026-10-19",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:13 AM",
    employees: crew(13, 14),
  },
  {
    date: "2026-10-20",
    status: "draft",
    submittedBy: "John Smith",
    submittedAt: "4:58 PM",
    employees: crew(12, 0),
  },
  {
    date: "2026-10-21",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:04 AM",
    employees: crew(14, 2),
  },
  {
    date: "2026-10-22",
    status: "submitted",
    submittedBy: "Priya Nair",
    submittedAt: "7:22 AM",
    employees: crew(11, 4),
  },
  {
    date: "2026-10-23",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:15 AM",
    employees: crew(13, 6),
    lostHours: { total: 1.5, reason: "Material delivery late" },
  },
  {
    date: "2026-10-26",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:10 AM",
    employees: crew(15, 8),
  },
  {
    date: "2026-10-27",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:19 AM",
    employees: crew(12, 10),
  },
  {
    date: "2026-10-28",
    status: "submitted",
    submittedBy: "Priya Nair",
    submittedAt: "7:07 AM",
    employees: crew(14, 12),
  },
  {
    date: "2026-10-29",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:24 AM",
    employees: crew(13, 14),
  },
  {
    date: "2026-10-30",
    status: "submitted",
    submittedBy: "John Smith",
    submittedAt: "7:12 AM",
    employees: crew(11, 1),
  },
]
