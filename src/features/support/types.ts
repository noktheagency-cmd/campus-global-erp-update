export type SupportTicketCategoryCode =
  | "TECHNICAL"
  | "PAYMENTS"
  | "DOCUMENTS"
  | "APPLICATIONS"
  | "ACCOUNT_ACCESS"
  | "SERVICE"
  | "OTHER";

export type SupportTicketPriorityCode = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportTicketStatusCode =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_FOR_REQUESTER"
  | "RESOLVED"
  | "CLOSED";

export type SupportMessageKindCode =
  | "PUBLIC_REPLY"
  | "INTERNAL_NOTE"
  | "SYSTEM";

export type SupportAttachmentRecord = {
  fileName: string;
  fileSize: number;
  id: string;
  mimeType: string;
  url: string | null;
};

export type SupportMessageRecord = {
  attachments: SupportAttachmentRecord[];
  author: {
    email: string;
    id: string;
    name: string;
  } | null;
  body: string;
  createdAt: string;
  id: string;
  kind: SupportMessageKindCode;
};

export type SupportTicketSummaryRecord = {
  assignedTo: {
    email: string;
    id: string;
    name: string;
  } | null;
  category: SupportTicketCategoryCode;
  code: string;
  id: string;
  lastActivityAt: string;
  priority: SupportTicketPriorityCode;
  requesterEmail: string;
  requesterId: string;
  requesterName: string;
  slaBreached: boolean;
  slaLabel: string;
  status: SupportTicketStatusCode;
  subject: string;
};

export type SupportTicketRecord = SupportTicketSummaryRecord & {
  closedAt: string | null;
  createdAt: string;
  description: string;
  firstResponseAt: string | null;
  messageLimitReached: boolean;
  messages: SupportMessageRecord[];
  relatedModule: string | null;
  resolvedAt: string | null;
};

export type SupportTeamMember = {
  email: string;
  id: string;
  name: string;
};

export type SupportWorkspaceData = {
  canCreate: boolean;
  canManage: boolean;
  currentUserId: string;
  metrics: {
    assignedToMe: number;
    mine: number;
    open: number;
    resolvedToday: number;
    waiting: number;
  };
  filters: {
    category: SupportTicketCategoryCode | "all";
    priority: SupportTicketPriorityCode | "all";
    query: string;
    status: SupportTicketStatusCode | "all";
  };
  pagination: {
    nextCursor: string | null;
    previousCursor: string | null;
    resultCount: number;
  };
  selectedTicket: SupportTicketRecord | null;
  teamMembers: SupportTeamMember[];
  tickets: SupportTicketSummaryRecord[];
};

export type SupportWorkspaceQuery = {
  category?: SupportTicketCategoryCode;
  cursor?: string;
  direction?: "next" | "previous";
  priority?: SupportTicketPriorityCode;
  query?: string;
  selectedTicketId?: string;
  status?: SupportTicketStatusCode;
};

export type SupportActionState = {
  fieldErrors?: Record<string, string[]>;
  message: string;
  status: "idle" | "error";
};
