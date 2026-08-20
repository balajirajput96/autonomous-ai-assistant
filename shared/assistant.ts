export const TASK_STATES = [
  "QUEUED",
  "PLANNING",
  "RUNNING",
  "WAITING",
  "RETRYING",
  "BLOCKED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

export const RISK_LEVELS = [
  "LOW_RISK",
  "MEDIUM_RISK",
  "HIGH_RISK",
  "DESTRUCTIVE",
  "EXTERNAL_PUBLISH",
  "FINANCIAL",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export type AssistantMode = "ASSISTED" | "AGENT";
export type MessageRole = "user" | "assistant" | "system";
export type CapabilityState = "AVAILABLE" | "CONFIGURATION_REQUIRED" | "PLANNED";
import type { TextScaleOption } from "@/shared/accessibility";

export interface ChatMessage {
  id: string;
  taskId?: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  citations?: Array<{ label: string; url: string }>;
}

export interface TaskStep {
  id: string;
  label: string;
  state: Exclude<TaskState, "CANCELLED">;
  createdAt: string;
  updatedAt: string;
  detail?: string;
}

export interface AssistantTask {
  id: string;
  title: string;
  prompt: string;
  mode: AssistantMode;
  state: TaskState;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  steps: TaskStep[];
  output?: string;
  error?: string;
  approvalRequired: boolean;
  usageEstimate?: string;
}

export interface AssistantPreferences {
  mode: AssistantMode;
  speechEnabled: boolean;
  saveTaskHistory: boolean;
  syncFailureAlerts: boolean;
  textScale: TextScaleOption;
  highContrast: boolean;
  colourScheme: "system" | "light" | "dark";
}

export interface CapabilityStatus {
  id: string;
  title: string;
  description: string;
  state: CapabilityState;
  requirement?: string;
}

export const DEFAULT_PREFERENCES: AssistantPreferences = {
  mode: "ASSISTED",
  speechEnabled: false,
  saveTaskHistory: true,
  syncFailureAlerts: false,
  textScale: "STANDARD",
  highContrast: false,
  colourScheme: "system",
};

export const CAPABILITY_STATUSES: CapabilityStatus[] = [
  {
    id: "local-task-tracking",
    title: "Local task tracking",
    description: "Task status and history are stored on this device for the MVP.",
    state: "AVAILABLE",
  },
  {
    id: "remote-ai",
    title: "Remote AI processing",
    description: "Text requests are sent through the built-in server-side model route; no provider key is embedded in this app.",
    state: "AVAILABLE",
  },
  {
    id: "connectors",
    title: "Connected apps",
    description: "Tool discovery, permissions, and revocation require a reviewed server-side integration.",
    state: "PLANNED",
    requirement: "OAuth and connector security review",
  },
  {
    id: "automation",
    title: "Scheduled workflows",
    description: "Persistent automation requires a monitored server worker and explicit policy controls.",
    state: "PLANNED",
    requirement: "Durable workflow service",
  },
];

export function taskStateLabel(state: TaskState): string {
  return state.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

export function riskLevelLabel(risk: RiskLevel): string {
  return risk.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

export function createTaskId(): string {
  return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
