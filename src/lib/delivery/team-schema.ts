export type TeamRole = "BACKEND" | "FRONTEND" | "FULLSTACK" | "QA" | "DEVOPS" | "DATA";

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  capacityPoints: number;
}
