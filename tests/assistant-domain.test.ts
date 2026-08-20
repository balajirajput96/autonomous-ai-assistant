import { describe, expect, it } from "vitest";

import {
  CAPABILITY_STATUSES,
  DEFAULT_PREFERENCES,
  RISK_LEVELS,
  TASK_STATES,
  riskLevelLabel,
  taskStateLabel,
} from "../shared/assistant";

describe("assistant domain model", () => {
  it("exposes every task state needed for an auditable task lifecycle", () => {
    expect(TASK_STATES).toEqual([
      "QUEUED",
      "PLANNING",
      "RUNNING",
      "WAITING",
      "RETRYING",
      "BLOCKED",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
    ]);
  });

  it("renders task and risk labels for a human-readable interface", () => {
    expect(taskStateLabel("RETRYING")).toBe("Retrying");
    expect(taskStateLabel("COMPLETED")).toBe("Completed");
    expect(riskLevelLabel("EXTERNAL_PUBLISH")).toBe("External Publish");
    expect(riskLevelLabel("LOW_RISK")).toBe("Low Risk");
  });

  it("starts in assisted mode and distinguishes available AI from planned connectors", () => {
    expect(DEFAULT_PREFERENCES.mode).toBe("ASSISTED");
    expect(RISK_LEVELS).toContain("DESTRUCTIVE");
    expect(CAPABILITY_STATUSES.find((capability) => capability.id === "remote-ai")?.state).toBe("AVAILABLE");
    expect(CAPABILITY_STATUSES.find((capability) => capability.id === "connectors")?.state).toBe("PLANNED");
  });
});
