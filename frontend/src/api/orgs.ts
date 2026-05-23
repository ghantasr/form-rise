import client from './client';
import type { Organization, OrgMember, OrgGroup, FormAssignment, AssignmentResult, StudentResult, StudentAssignment } from '../types/org';

export const orgsApi = {
  create: (name: string) =>
    client.post<Organization>('/orgs', { name }),

  getMy: () =>
    client.get<Organization | null>('/orgs/my'),

  getMembers: (orgId: string) =>
    client.get<OrgMember[]>(`/orgs/${orgId}/members`),

  invite: (orgId: string, email?: string, role?: string) =>
    client.post<{ token: string; joinUrl: string }>(`/orgs/${orgId}/invite`, { email, role }),

  join: (token: string) =>
    client.post<{ org: Organization }>(`/orgs/join/${token}`),

  updateMemberRole: (orgId: string, userId: string, role: string) =>
    client.patch(`/orgs/${orgId}/members/${userId}/role`, { role }),

  removeMember: (orgId: string, userId: string) =>
    client.delete(`/orgs/${orgId}/members/${userId}`),

  createGroup: (orgId: string, name: string) =>
    client.post<OrgGroup>(`/orgs/${orgId}/groups`, { name }),

  listGroups: (orgId: string) =>
    client.get<OrgGroup[]>(`/orgs/${orgId}/groups`),

  deleteGroup: (orgId: string, groupId: string) =>
    client.delete(`/orgs/${orgId}/groups/${groupId}`),

  getGroupMembers: (orgId: string, groupId: string) =>
    client.get<OrgMember[]>(`/orgs/${orgId}/groups/${groupId}/members`),

  addGroupMembers: (orgId: string, groupId: string, userIds: string[]) =>
    client.post(`/orgs/${orgId}/groups/${groupId}/members`, { userIds }),

  removeGroupMember: (orgId: string, groupId: string, userId: string) =>
    client.delete(`/orgs/${orgId}/groups/${groupId}/members/${userId}`),

  getOrgAssignments: (orgId: string) =>
    client.get<FormAssignment[]>(`/orgs/${orgId}/assignments`),
};

export const assignmentsApi = {
  create: (
    formId: string,
    data: { groupId: string; opensAt?: string; closesAt?: string; mode?: string }
  ) => client.post<FormAssignment>(`/forms/${formId}/assignments`, data),

  list: (formId: string) =>
    client.get<FormAssignment[]>(`/forms/${formId}/assignments`),

  delete: (formId: string, assignmentId: string) =>
    client.delete(`/forms/${formId}/assignments/${assignmentId}`),

  getResults: (formId: string, assignmentId: string) =>
    client.get<AssignmentResult[]>(`/forms/${formId}/assignments/${assignmentId}/results`),
};

export const studentsApi = {
  getMyResults: () =>
    client.get<StudentResult[]>('/students/results'),

  getMyAssignments: () =>
    client.get<StudentAssignment[]>('/students/assignments'),
};
