import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  createTaskId,
  DEFAULT_PREFERENCES,
  type AssistantMode,
  type AssistantPreferences,
  type AssistantTask,
  type ChatMessage,
  type RiskLevel,
  type TaskStep,
} from "@/shared/assistant";
import { trpc } from "@/lib/trpc";
import type { ConnectorApprovalRequest, ConnectorProviderId, ConnectorRecord } from "@/shared/connectors";
import { presentSyncFailureNotification, requestSyncFailureNotificationPermission } from "@/lib/sync-failure-notifications";
import { registerDevicePushToken, subscribeToDevicePushTokenChanges } from "@/lib/sync-failure-notifications";
import { createSyncFailureAlert, type SyncFailureAlert, type SyncFailureKind } from "@/shared/sync-failure-alerts";
import type { DevicePushTokenRegistration } from "@/shared/push-token-registration";

const STORAGE_KEYS = {
  messages: "autonomous-ai-assistant/messages-v1",
  tasks: "autonomous-ai-assistant/tasks-v1",
  preferences: "autonomous-ai-assistant/preferences-v1",
  connectors: "autonomous-ai-assistant/connectors-v1",
  syncFailureAlerts: "autonomous-ai-assistant/sync-failure-alerts-v1",
  pushTokenRegistration: "autonomous-ai-assistant/push-token-registration-v1",
} as const;

const STARTER_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I’m ready to help you think through tasks, keep their status visible, and pause whenever an action needs your approval.",
  createdAt: new Date().toISOString(),
};

type AssistantContextValue = {
  isReady: boolean;
  messages: ChatMessage[];
  tasks: AssistantTask[];
  preferences: AssistantPreferences;
  submitPrompt: (prompt: string) => void;
  setMode: (mode: AssistantMode) => void;
  updatePreferences: (update: Partial<AssistantPreferences>) => void;
  clearLocalWorkspace: () => void;
  connectorRecords: ConnectorRecord[];
  recordConnectorApproval: (request: ConnectorApprovalRequest) => void;
  removeConnectorApproval: (providerId: ConnectorProviderId) => void;
  syncFailureAlerts: SyncFailureAlert[];
  setSyncFailureAlertsEnabled: (enabled: boolean) => Promise<boolean>;
  recordSyncFailure: (providerId: ConnectorProviderId, kind: SyncFailureKind, retryAt?: string) => void;
  markSyncFailureAlertRead: (alertId: string) => void;
  pushTokenRegistration: DevicePushTokenRegistration;
  registerDevicePushToken: () => Promise<DevicePushTokenRegistration>;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

function classifyRisk(prompt: string, mode: AssistantMode): RiskLevel {
  const normalized = prompt.toLowerCase();

  if (/\b(pay|payment|transfer|buy|sell|invest|wire)\b/.test(normalized)) return "FINANCIAL";
  if (/\b(delete|erase|wipe|remove)\b/.test(normalized)) return "DESTRUCTIVE";
  if (/\b(publish|post|send|email|message|share publicly)\b/.test(normalized)) return "EXTERNAL_PUBLISH";
  if (/\b(change production|deploy|release|revoke|commit)\b/.test(normalized)) return "HIGH_RISK";
  return mode === "AGENT" ? "MEDIUM_RISK" : "LOW_RISK";
}

function requiresApproval(riskLevel: RiskLevel): boolean {
  return ["HIGH_RISK", "DESTRUCTIVE", "EXTERNAL_PUBLISH", "FINANCIAL"].includes(riskLevel);
}

function titleFromPrompt(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length > 54 ? `${normalized.slice(0, 51)}…` : normalized;
}

function updateStep(steps: TaskStep[], stepId: string, state: TaskStep["state"], detail?: string): TaskStep[] {
  const now = new Date().toISOString();
  return steps.map((step) =>
    step.id === stepId
      ? {
          ...step,
          state,
          updatedAt: now,
          ...(detail ? { detail } : {}),
        }
      : step,
  );
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [tasks, setTasks] = useState<AssistantTask[]>([]);
  const [preferences, setPreferences] = useState<AssistantPreferences>(DEFAULT_PREFERENCES);
  const [connectorRecords, setConnectorRecords] = useState<ConnectorRecord[]>([]);
  const [syncFailureAlerts, setSyncFailureAlerts] = useState<SyncFailureAlert[]>([]);
  const [pushTokenRegistration, setPushTokenRegistration] = useState<DevicePushTokenRegistration>({ state: "NOT_REGISTERED", updatedAt: new Date().toISOString() });
  const { mutateAsync: requestAssistantReply } = trpc.assistant.respond.useMutation();

  useEffect(() => {
    let cancelled = false;

    async function restoreLocalWorkspace() {
      try {
        const values = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        if (cancelled) return;

        const storedMessages = values.find(([key]) => key === STORAGE_KEYS.messages)?.[1];
        const storedTasks = values.find(([key]) => key === STORAGE_KEYS.tasks)?.[1];
        const storedPreferences = values.find(([key]) => key === STORAGE_KEYS.preferences)?.[1];
        const storedConnectors = values.find(([key]) => key === STORAGE_KEYS.connectors)?.[1];
        const storedSyncFailureAlerts = values.find(([key]) => key === STORAGE_KEYS.syncFailureAlerts)?.[1];
        const storedPushTokenRegistration = values.find(([key]) => key === STORAGE_KEYS.pushTokenRegistration)?.[1];

        if (storedMessages) {
          const parsed = JSON.parse(storedMessages) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
        }
        if (storedTasks) {
          const parsed = JSON.parse(storedTasks) as AssistantTask[];
          if (Array.isArray(parsed)) setTasks(parsed);
        }
        if (storedPreferences) {
          const parsed = JSON.parse(storedPreferences) as Partial<AssistantPreferences>;
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
        if (storedConnectors) {
          const parsed = JSON.parse(storedConnectors) as ConnectorRecord[];
          if (Array.isArray(parsed)) setConnectorRecords(parsed);
        }
        if (storedSyncFailureAlerts) {
          const parsed = JSON.parse(storedSyncFailureAlerts) as SyncFailureAlert[];
          if (Array.isArray(parsed)) setSyncFailureAlerts(parsed);
        }
        if (storedPushTokenRegistration) {
          const parsed = JSON.parse(storedPushTokenRegistration) as DevicePushTokenRegistration;
          if (parsed && typeof parsed.state === "string") setPushTokenRegistration(parsed);
        }
      } catch {
        // The assistant remains usable with its in-memory defaults when local storage is unavailable.
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void restoreLocalWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const preferenceWrite = AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
    const connectorWrite = AsyncStorage.setItem(STORAGE_KEYS.connectors, JSON.stringify(connectorRecords));
    const syncFailureAlertWrite = AsyncStorage.setItem(STORAGE_KEYS.syncFailureAlerts, JSON.stringify(syncFailureAlerts));
    const pushTokenRegistrationWrite = AsyncStorage.setItem(STORAGE_KEYS.pushTokenRegistration, JSON.stringify(pushTokenRegistration));
    const workspaceWrite = preferences.saveTaskHistory
      ? AsyncStorage.multiSet([
          [STORAGE_KEYS.messages, JSON.stringify(messages)],
          [STORAGE_KEYS.tasks, JSON.stringify(tasks)],
        ])
      : AsyncStorage.multiRemove([STORAGE_KEYS.messages, STORAGE_KEYS.tasks]);
    void Promise.all([preferenceWrite, connectorWrite, syncFailureAlertWrite, pushTokenRegistrationWrite, workspaceWrite]);
  }, [connectorRecords, isReady, messages, preferences, pushTokenRegistration, syncFailureAlerts, tasks]);

  const setMode = useCallback((mode: AssistantMode) => {
    setPreferences((current) => ({ ...current, mode }));
  }, []);

  const updatePreferences = useCallback((update: Partial<AssistantPreferences>) => {
    setPreferences((current) => ({ ...current, ...update }));
  }, []);

  const clearLocalWorkspace = useCallback(() => {
    setMessages([{ ...STARTER_MESSAGE, createdAt: new Date().toISOString() }]);
    setTasks([]);
  }, []);

  const recordConnectorApproval = useCallback((request: ConnectorApprovalRequest) => {
    const approvalRecordedAt = new Date().toISOString();
    setConnectorRecords((current) => {
      const next: ConnectorRecord = {
        providerId: request.providerId as ConnectorProviderId,
        state: "APPROVAL_RECORDED",
        approvalRecordedAt,
        lastRequestedActionId: request.actionId,
      };
      return [...current.filter((record) => record.providerId !== request.providerId), next];
    });
  }, []);

  const removeConnectorApproval = useCallback((providerId: ConnectorProviderId) => {
    setConnectorRecords((current) => current.filter((record) => record.providerId !== providerId || record.state !== "APPROVAL_RECORDED"));
  }, []);

  const setSyncFailureAlertsEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!enabled) {
      setPreferences((current) => ({ ...current, syncFailureAlerts: false }));
      setPushTokenRegistration({ state: "NOT_REGISTERED", updatedAt: new Date().toISOString(), detail: "Device-token registration was cleared locally when sync-failure alerts were disabled." });
      return true;
    }

    const granted = await requestSyncFailureNotificationPermission();
    setPreferences((current) => ({ ...current, syncFailureAlerts: granted }));
    return granted;
  }, []);

  const recordSyncFailure = useCallback(
    (providerId: ConnectorProviderId, kind: SyncFailureKind, retryAt?: string) => {
      const alert = createSyncFailureAlert(providerId, kind, retryAt);
      setSyncFailureAlerts((current) => [alert, ...current]);
      if (preferences.syncFailureAlerts) {
        void presentSyncFailureNotification(alert).then((deliveredLocally) => {
          if (!deliveredLocally) return;
          setSyncFailureAlerts((current) => current.map((item) => (item.id === alert.id ? { ...item, deliveredLocally } : item)));
        });
      }
    },
    [preferences.syncFailureAlerts],
  );

  const markSyncFailureAlertRead = useCallback((alertId: string) => {
    setSyncFailureAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, readAt: new Date().toISOString() } : alert)));
  }, []);

  const registerCurrentDevicePushToken = useCallback(async (): Promise<DevicePushTokenRegistration> => {
    if (!preferences.syncFailureAlerts) {
      const registration: DevicePushTokenRegistration = {
        state: "NOT_REGISTERED",
        updatedAt: new Date().toISOString(),
        detail: "Enable sync-failure alerts before registering this device for background delivery.",
      };
      setPushTokenRegistration(registration);
      return registration;
    }
    setPushTokenRegistration({ state: "REGISTERING", updatedAt: new Date().toISOString(), detail: "Requesting device token…" });
    const registration = await registerDevicePushToken();
    setPushTokenRegistration(registration);
    return registration;
  }, [preferences.syncFailureAlerts]);

  useEffect(() => {
    if (!preferences.syncFailureAlerts) return;
    const subscription = subscribeToDevicePushTokenChanges(setPushTokenRegistration);
    return () => subscription.remove();
  }, [preferences.syncFailureAlerts]);

  const submitPrompt = useCallback(
    (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt) return;

      const createdAt = new Date().toISOString();
      const riskLevel = classifyRisk(prompt, preferences.mode);
      const approvalRequired = requiresApproval(riskLevel);
      const taskId = createTaskId();
      const task: AssistantTask = {
        id: taskId,
        title: titleFromPrompt(prompt),
        prompt,
        mode: preferences.mode,
        state: "PLANNING",
        riskLevel,
        createdAt,
        updatedAt: createdAt,
        approvalRequired,
        usageEstimate: "Local MVP task",
        steps: [
          {
            id: `${taskId}_understand`,
            label: "Understand your request",
            state: "RUNNING",
            createdAt,
            updatedAt: createdAt,
          },
          {
            id: `${taskId}_policy`,
            label: "Check the execution policy",
            state: "QUEUED",
            createdAt,
            updatedAt: createdAt,
          },
          {
            id: `${taskId}_respond`,
            label: "Prepare a response",
            state: "QUEUED",
            createdAt,
            updatedAt: createdAt,
          },
        ],
      };

      setTasks((current) => [task, ...current]);
      setMessages((current) => [
        ...current,
        { id: `${taskId}_user`, taskId, role: "user", content: prompt, createdAt },
      ]);

      void (async () => {
        if (approvalRequired) {
          const updatedAt = new Date().toISOString();
          const output = "This request reaches an action that needs your explicit approval. The app has paused it and will not perform any external or consequential action.";
          setTasks((current) =>
            current.map((item) => {
              if (item.id !== taskId) return item;
              const understood = updateStep(item.steps, `${taskId}_understand`, "COMPLETED", "Intent captured.");
              const policyChecked = updateStep(understood, `${taskId}_policy`, "COMPLETED", "Approval is required before continuing.");
              return {
                ...item,
                state: "WAITING",
                updatedAt,
                steps: updateStep(policyChecked, `${taskId}_respond`, "WAITING", "Paused for your approval."),
                output,
              };
            }),
          );
          setMessages((current) => [...current, { id: `${taskId}_assistant`, taskId, role: "assistant", content: output, createdAt: updatedAt }]);
          return;
        }

        try {
          const response = await requestAssistantReply({ prompt, mode: preferences.mode });
          const updatedAt = new Date().toISOString();
          setTasks((current) =>
            current.map((item) => {
              if (item.id !== taskId) return item;
              const understood = updateStep(item.steps, `${taskId}_understand`, "COMPLETED", "Intent captured.");
              const policyChecked = updateStep(understood, `${taskId}_policy`, "COMPLETED", "Remote response is allowed; no external action is enabled.");
              return {
                ...item,
                state: "COMPLETED",
                updatedAt,
                steps: updateStep(policyChecked, `${taskId}_respond`, "COMPLETED", `Response received from ${response.model}.`),
                output: response.content,
                usageEstimate: response.usage ? `${response.usage.promptTokens + response.usage.completionTokens} tokens` : `Model: ${response.model}`,
              };
            }),
          );
          setMessages((current) => [...current, { id: `${taskId}_assistant`, taskId, role: "assistant", content: response.content, createdAt: updatedAt }]);
        } catch (error) {
          const updatedAt = new Date().toISOString();
          const output = error instanceof Error ? error.message : "The assistant could not complete this request. Please try again.";
          setTasks((current) =>
            current.map((item) => {
              if (item.id !== taskId) return item;
              const understood = updateStep(item.steps, `${taskId}_understand`, "COMPLETED", "Intent captured.");
              const policyChecked = updateStep(understood, `${taskId}_policy`, "COMPLETED", "No external action was enabled.");
              return {
                ...item,
                state: "FAILED",
                updatedAt,
                error: output,
                steps: updateStep(policyChecked, `${taskId}_respond`, "FAILED", "Provider response was unavailable."),
              };
            }),
          );
          setMessages((current) => [...current, { id: `${taskId}_assistant_error`, taskId, role: "assistant", content: output, createdAt: updatedAt }]);
        }
      })();
    },
    [preferences.mode, requestAssistantReply],
  );

  const value = useMemo(
    () => ({ isReady, messages, tasks, preferences, submitPrompt, setMode, updatePreferences, clearLocalWorkspace, connectorRecords, recordConnectorApproval, removeConnectorApproval, syncFailureAlerts, setSyncFailureAlertsEnabled, recordSyncFailure, markSyncFailureAlertRead, pushTokenRegistration, registerDevicePushToken: registerCurrentDevicePushToken }),
    [clearLocalWorkspace, connectorRecords, isReady, markSyncFailureAlertRead, messages, preferences, pushTokenRegistration, recordConnectorApproval, recordSyncFailure, registerCurrentDevicePushToken, removeConnectorApproval, setMode, setSyncFailureAlertsEnabled, submitPrompt, syncFailureAlerts, tasks, updatePreferences],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within AssistantProvider");
  return context;
}
