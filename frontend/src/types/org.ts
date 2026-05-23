export interface Organization {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  groupCount: number;
  createdAt: string;
}

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

export interface OrgGroup {
  id: string;
  name: string;
  memberCount: number;
  assignmentCount: number;
  isDefault: boolean;
}

export interface FormAssignment {
  id: string;
  formId: string;
  formTitle: string;
  groupId: string;
  groupName: string;
  opensAt?: string;
  closesAt?: string;
  mode: 'attempt_once' | 'unlimited';
  submittedCount: number;
  memberCount: number;
  createdAt: string;
  isDefaultGroup: boolean;
}

export interface AssignmentResult {
  responseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  totalScore?: number;
  maxScore?: number;
  isPassed?: boolean;
  submittedAt: string;
}

export interface StudentResult {
  responseId: string;
  formId: string;
  formTitle: string;
  slug: string;
  totalScore?: number;
  maxScore?: number;
  isPassed?: boolean;
  submittedAt: string;
}

export interface StudentAssignment {
  assignmentId: string;
  formId: string;
  formTitle: string;
  formSlug: string;
  groupName: string;
  opensAt?: string;
  closesAt?: string;
  mode: 'attempt_once' | 'unlimited';
  hasSubmitted: boolean;
  totalScore?: number;
  maxScore?: number;
  isPassed?: boolean;
}
