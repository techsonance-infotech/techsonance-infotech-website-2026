export interface TeamMember {
  id: string;
  avatarUrl: string;
}

export interface AvatarGroup {
  id: string;
  title: string;
  members: TeamMember[];
}

export interface StatItem {
  value: string;
  label: string;
}

