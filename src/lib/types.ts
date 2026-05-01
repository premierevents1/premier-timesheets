export type Role = "staff" | "manager" | "admin";
export type EntryStatus = "pending" | "approved" | "rejected";
export type LeaveType =
  | "Annual Leave"
  | "Annual Leave (½ day)"
  | "TOIL"
  | "TOIL (½ day)"
  | "Sick"
  | "Sick (½ day)";

export interface Department {
  id: string;
  name: string;
  location: string;
  export_code: string;
  default_start: string;
  default_end: string;
  default_break: number;
}

export interface User {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  default_dept: string;
  manager_id: string | null;
  departments: string[];
}

export interface TimesheetEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_first: string;
  user_last: string;
  date: string;
  department_id: string;
  start_time: string | null;
  end_time: string | null;
  break_mins: number;
  total_hours: number;
  leave_type: LeaveType | null;
  comment: string;
  status: EntryStatus;
  approved_by: string | null;
  approver_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: Role;
  default_dept: string;
  departments: string[];
  manager_id: string | null;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "technician",
    name: "Technician",
    location: "Premier UK Events Ltd",
    export_code: "PRE",
    default_start: "09:00",
    default_end: "17:00",
    default_break: 30,
  },
  {
    id: "warehouse",
    name: "Warehouse",
    location: "Premier UK Events Ltd",
    export_code: "PRE",
    default_start: "09:00",
    default_end: "17:30",
    default_break: 60,
  },
  {
    id: "woodshop",
    name: "Woodshop",
    location: "Unit 43 - Woodshop",
    export_code: "UNI",
    default_start: "08:00",
    default_end: "16:00",
    default_break: 60,
  },
  {
    id: "accounts",
    name: "Accounts",
    location: "Premier UK Events Ltd",
    export_code: "PRE",
    default_start: "09:00",
    default_end: "17:00",
    default_break: 60,
  },
];

export const LEAVE_TYPES: { id: string; label: LeaveType; icon: string; color: string }[] = [
  { id: "annual", label: "Annual Leave", icon: "🌴", color: "#d97706" },
  { id: "annual-half", label: "Annual Leave (½ day)", icon: "🌴", color: "#d97706" },
  { id: "toil", label: "TOIL", icon: "⏰", color: "#6366f1" },
  { id: "toil-half", label: "TOIL (½ day)", icon: "⏰", color: "#6366f1" },
  { id: "sick", label: "Sick", icon: "🤒", color: "#ef4444" },
  { id: "sick-half", label: "Sick (½ day)", icon: "🤒", color: "#ef4444" },
];

export function getDept(id: string): Department {
  return DEPARTMENTS.find((d) => d.id === id) ?? DEPARTMENTS[0];
}

export function getLeave(label: string) {
  return LEAVE_TYPES.find((l) => l.label === label);
}

export function leaveHours(leaveType: string): number {
  return leaveType.includes("½") ? 3.75 : 7.5;
}
