import { describe, expect, it } from "vitest";

import {
  CONNECTOR_CATALOG,
  CONNECTOR_PROVIDERS,
  connectorOperationLabel,
  connectorStateDescription,
  connectorStateLabel,
  getConnectorAction,
} from "../shared/connectors";

describe("connector approval domain", () => {
  it("starts every provider in a configuration-required state", () => {
    expect(CONNECTOR_PROVIDERS).toEqual(["github", "google-calendar", "gmail"]);
    expect(CONNECTOR_CATALOG.every((connector) => connector.defaultState === "CONFIGURATION_REQUIRED")).toBe(true);
  });

  it("does not expose an executable external action before OAuth hardening is complete", () => {
    const allActions = CONNECTOR_CATALOG.flatMap((connector) => connector.actions);
    expect(allActions.length).toBeGreaterThan(0);
    expect(allActions.every((action) => action.executableInMvp === false)).toBe(true);
  });

  it("keeps approval details explicit and human-readable", () => {
    const sendMail = getConnectorAction("gmail", "gmail-send-mail");
    expect(sendMail.operation).toBe("PUBLISH");
    expect(sendMail.riskLevel).toBe("EXTERNAL_PUBLISH");
    expect(connectorOperationLabel("DESTRUCTIVE")).toBe("Destructive");
    expect(connectorStateLabel("APPROVAL_RECORDED")).toBe("Approval Recorded");
    expect(connectorStateDescription("APPROVAL_RECORDED")).toContain("no OAuth consent");
    expect(connectorStateDescription("REVOKED")).toContain("server-side flow");
  });
});
