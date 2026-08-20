import type { RiskLevel } from "@/shared/assistant";

export const CONNECTOR_PROVIDERS = ["github", "google-calendar", "gmail"] as const;
export type ConnectorProviderId = (typeof CONNECTOR_PROVIDERS)[number];

export const CONNECTOR_STATES = [
  "CONFIGURATION_REQUIRED",
  "DISCONNECTED",
  "APPROVAL_RECORDED",
  "CONNECTED",
  "EXPIRED",
  "REVOKED",
] as const;
export type ConnectorState = (typeof CONNECTOR_STATES)[number];

export const CONNECTOR_OPERATION_TYPES = ["CONNECT", "READ", "WRITE", "PUBLISH", "DESTRUCTIVE"] as const;
export type ConnectorOperationType = (typeof CONNECTOR_OPERATION_TYPES)[number];

export type ConnectorAction = {
  id: string;
  label: string;
  description: string;
  operation: ConnectorOperationType;
  riskLevel: RiskLevel;
  requiredScopeLabel: string;
  executableInMvp: boolean;
};

export type ConnectorDefinition = {
  id: ConnectorProviderId;
  title: string;
  shortLabel: string;
  description: string;
  oauthRequirement: string;
  scopeSummary: string;
  defaultState: ConnectorState;
  actions: ConnectorAction[];
};

export type ConnectorRecord = {
  providerId: ConnectorProviderId;
  state: ConnectorState;
  approvalRecordedAt?: string;
  lastRequestedActionId?: string;
};

export type ConnectorApprovalRequest = {
  id: string;
  providerId: ConnectorProviderId;
  actionId: string;
  requestedAt: string;
};

export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  {
    id: "github",
    title: "GitHub",
    shortLabel: "GH",
    description: "Review repository context and prepare developer workflows with controlled, read-first access.",
    oauthRequirement: "A registered OAuth or GitHub App client, a fixed HTTPS callback, and server-side token storage.",
    scopeSummary: "Read-first profile and repository context; fine-grained permissions are preferred for production repository access.",
    defaultState: "CONFIGURATION_REQUIRED",
    actions: [
      {
        id: "github-connect",
        label: "Review connection",
        description: "Review the scope boundary needed before authorizing a GitHub account.",
        operation: "CONNECT",
        riskLevel: "MEDIUM_RISK",
        requiredScopeLabel: "Read-first profile and repository context",
        executableInMvp: false,
      },
      {
        id: "github-read-repos",
        label: "Read repository context",
        description: "Propose a read of repository metadata after a verified connection exists.",
        operation: "READ",
        riskLevel: "LOW_RISK",
        requiredScopeLabel: "Repository metadata read access",
        executableInMvp: false,
      },
      {
        id: "github-write-issue",
        label: "Create an issue",
        description: "Create an issue in a repository after a specific user confirmation.",
        operation: "WRITE",
        riskLevel: "HIGH_RISK",
        requiredScopeLabel: "Repository issue write access",
        executableInMvp: false,
      },
    ],
  },
  {
    id: "google-calendar",
    title: "Google Calendar",
    shortLabel: "GC",
    description: "Review calendar context and help plan time without changing events automatically.",
    oauthRequirement: "A verified Google OAuth consent configuration, fixed HTTPS callback, PKCE, and server-side token storage.",
    scopeSummary: "Read-only calendar context first; event creation and modification require a separate action approval.",
    defaultState: "CONFIGURATION_REQUIRED",
    actions: [
      {
        id: "calendar-connect",
        label: "Review connection",
        description: "Review the calendar consent boundary before authorizing an account.",
        operation: "CONNECT",
        riskLevel: "MEDIUM_RISK",
        requiredScopeLabel: "Calendar read-only access",
        executableInMvp: false,
      },
      {
        id: "calendar-read-events",
        label: "Read event context",
        description: "Propose a read of calendar event summaries after a verified connection exists.",
        operation: "READ",
        riskLevel: "LOW_RISK",
        requiredScopeLabel: "Calendar event read access",
        executableInMvp: false,
      },
      {
        id: "calendar-create-event",
        label: "Create event",
        description: "Create an event only after an explicit, event-specific confirmation.",
        operation: "WRITE",
        riskLevel: "HIGH_RISK",
        requiredScopeLabel: "Calendar event write access",
        executableInMvp: false,
      },
    ],
  },
  {
    id: "gmail",
    title: "Gmail",
    shortLabel: "GM",
    description: "Review user-requested mail context and prepare drafts without sending on the user’s behalf.",
    oauthRequirement: "A verified Google OAuth consent configuration, fixed HTTPS callback, PKCE, and server-side token storage.",
    scopeSummary: "Mailbox search and draft context must be separately consented; sending or deletion always needs a second confirmation.",
    defaultState: "CONFIGURATION_REQUIRED",
    actions: [
      {
        id: "gmail-connect",
        label: "Review connection",
        description: "Review the mailbox consent boundary before authorizing an account.",
        operation: "CONNECT",
        riskLevel: "MEDIUM_RISK",
        requiredScopeLabel: "Mailbox read and draft context",
        executableInMvp: false,
      },
      {
        id: "gmail-search-mail",
        label: "Search mail context",
        description: "Propose a mailbox search after a verified connection exists.",
        operation: "READ",
        riskLevel: "MEDIUM_RISK",
        requiredScopeLabel: "Mailbox read access",
        executableInMvp: false,
      },
      {
        id: "gmail-send-mail",
        label: "Send email",
        description: "Send a message only after the recipient, content, and effect are explicitly confirmed.",
        operation: "PUBLISH",
        riskLevel: "EXTERNAL_PUBLISH",
        requiredScopeLabel: "Mail send access",
        executableInMvp: false,
      },
    ],
  },
];

export function getConnector(providerId: ConnectorProviderId): ConnectorDefinition {
  const connector = CONNECTOR_CATALOG.find((item) => item.id === providerId);
  if (!connector) throw new Error(`Unknown connector provider: ${providerId}`);
  return connector;
}

export function getConnectorAction(providerId: ConnectorProviderId, actionId: string): ConnectorAction {
  const connector = getConnector(providerId);
  const action = connector.actions.find((item) => item.id === actionId);
  if (!action) throw new Error(`Unknown connector action: ${actionId}`);
  return action;
}

export function connectorStateLabel(state: ConnectorState): string {
  return state.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function connectorOperationLabel(operation: ConnectorOperationType): string {
  return operation.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
