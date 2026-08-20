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

const STORAGE_KEYS = {
  messages: "autonomous-ai-assistant/messages-v1",
  tasks: "autonomous-ai-assistant/tasks-v1",
  preferences: "autonomous-ai-assistant/preferences-v1",
  connectors: "autonomous-ai-assistant/connectors-v1",
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
    const workspaceWrite = preferences.saveTaskHistory
      ? AsyncStorage.multiSet([
          [STORAGE_KEYS.messages, JSON.stringify(messages)],
          [STORAGE_KEYS.tasks, JSON.stringify(tasks)],
        ])
      : AsyncStorage.multiRemove([STORAGE_KEYS.messages, STORAGE_KEYS.tasks]);
    void Promise.all([preferenceWrite, connectorWrite, workspaceWrite]);
  }, [connectorRecords, isReady, messages, preferences, tasks]);

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
    () => ({ isReady, messages, tasks, preferences, submitPrompt, setMode, updatePreferences, clearLocalWorkspace, connectorRecords, recordConnectorApproval }),
    [clearLocalWorkspace, connectorRecords, isReady, messages, preferences, recordConnectorApproval, setMode, submitPrompt, tasks, updatePreferences],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within AssistantProvider");
  return context;
}
