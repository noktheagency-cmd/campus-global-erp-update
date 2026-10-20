export type MoneyValue = {
  amount: number;
  currency: string;
};

export type ServicePriceOverride = MoneyValue & {
  agentId: string;
  agentName: string;
  id: string;
  validFrom: string;
};

export type ServiceAdminRecord = {
  agentBasePrice: MoneyValue | null;
  agentOverrides: ServicePriceOverride[];
  availableToAgents: boolean;
  availableToStudents: boolean;
  createdAt: string;
  description: string;
  id: string;
  name: string;
  orderCount: number;
  priceProposals: ServiceQuoteRequestRecord[];
  quoteRequestCount: number;
  sortOrder: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  studentPrice: MoneyValue | null;
  updatedAt: string;
};

export type ServiceCatalogRecord = {
  activeQuote: ServiceQuoteRequestRecord | null;
  available: boolean;
  description: string;
  id: string;
  name: string;
  price: MoneyValue | null;
  priceKind:
    | "agent-custom"
    | "agent-base"
    | "student-base"
    | "quote-required"
    | "unavailable";
};

export type ServiceQuoteStatus =
  | "PENDING"
  | "OFFERED"
  | "REJECTED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";

export type ServiceQuoteRequestRecord = {
  agentName: string;
  agentRespondedAt: string | null;
  agentResponseNote: string;
  code: string;
  createdAt: string;
  currency: string | null;
  id: string;
  isExpired: boolean;
  offerValidUntil: string | null;
  offeredUnitPrice: number | null;
  orderCode: string | null;
  purpose: "ORDER" | "PRICE_OVERRIDE";
  quantity: number;
  requestNote: string;
  reviewedAt: string | null;
  reviewerName: string;
  serviceId: string;
  serviceName: string;
  staffResponseNote: string;
  status: ServiceQuoteStatus;
  standardCurrency: string | null;
  standardUnitPrice: number | null;
  totalAmount: number | null;
};

export type ServiceOrderRecord = {
  buyerName: string;
  buyerType: "AGENT" | "STUDENT";
  code: string;
  createdAt: string;
  customerNote: string;
  id: string;
  internalNote: string;
  quantity: number;
  serviceName: string;
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  unitPrice: number;
  currency: string;
};

export type ServiceAgentOption = {
  id: string;
  label: string;
};

export type DocumentOrderStatus =
  | "ORDERED"
  | "IN_PROGRESS"
  | "PREPARING"
  | "AT_OFFICE"
  | "DELIVERED"
  | "RETURNED";

export type DocumentOrderStatusHistoryRecord = {
  changedByName: string;
  createdAt: string;
  id: string;
  note: string;
  status: DocumentOrderStatus;
};

export type DocumentOrderRecord = {
  agentId: string | null;
  agentName: string;
  beneficiaryFin: string;
  beneficiaryName: string;
  beneficiaryPassport: string;
  beneficiarySurname: string;
  code: string;
  createdAt: string;
  createdByName: string;
  currency: string;
  deliveredAt: string | null;
  deliveryDate: string | null;
  externalStudentPassport: string;
  id: string;
  managerId: string | null;
  managerName: string;
  note: string;
  paidAt: string | null;
  paymentStatus: "UNPAID" | "PAID";
  price: number | null;
  recipientFin: string;
  recipientName: string;
  recipientSurname: string;
  recipientType: "STUDENT" | "AGENT" | "OTHER" | null;
  serviceId: string | null;
  serviceName: string;
  source: "SYSTEM" | "WHATSAPP" | "PHONE";
  status: DocumentOrderStatus;
  statusHistory: DocumentOrderStatusHistoryRecord[];
  studentId: string | null;
  studentName: string;
};

export type DocumentOrderOption = {
  id: string;
  label: string;
  passportNo?: string;
};

export type StaffServicesWorkspaceData = {
  agents: ServiceAgentOption[];
  canCreateDocumentOrders: boolean;
  canManage: boolean;
  canReviewQuotes: boolean;
  canUpdateDocumentOrders: boolean;
  canUpdateOrders: boolean;
  documentOrderMetrics: Record<DocumentOrderStatus | "ALL", number>;
  documentOrderOptions: {
    agents: DocumentOrderOption[];
    managers: DocumentOrderOption[];
    services: DocumentOrderOption[];
    students: DocumentOrderOption[];
  };
  documentOrders: DocumentOrderRecord[];
  metrics: {
    activeServices: number;
    completedOrders: number;
    customAgentPrices: number;
    pendingOrders: number;
    pendingQuoteRequests: number;
  };
  mode: "staff";
  orders: ServiceOrderRecord[];
  quoteRequests: ServiceQuoteRequestRecord[];
  services: ServiceAdminRecord[];
};

export type PortalServicesWorkspaceData = {
  buyerType: "AGENT" | "STUDENT";
  mode: "portal";
  orders: ServiceOrderRecord[];
  quoteRequests: ServiceQuoteRequestRecord[];
  services: ServiceCatalogRecord[];
};

export type ServicesWorkspaceData =
  | StaffServicesWorkspaceData
  | PortalServicesWorkspaceData;
