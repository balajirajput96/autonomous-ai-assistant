# Security Model

## Security Objective

The system protects user data, execution authority, credentials, and audit integrity while acknowledging that external providers and connectors create separate trust boundaries. The product must choose least privilege and explicit consent over autonomous convenience.

## Threat and Control Matrix

| Threat | Primary Control | Verification Evidence |
| --- | --- | --- |
| Provider-key exposure | Server-only model invocation; no keys in app configuration, source, logs, or APK assets. | Secret scan and reviewed deployment configuration. |
| Prompt injection through files or web content | Treat retrieved content as untrusted data; isolate instruction channels; restrict tools and validate each action. | Adversarial tool-use tests. |
| Unsafe model-proposed tool call | Schema validation, allowlisted registry, risk policy, and approval gate before execution. | Tool contract tests and audit events. |
| Token theft or OAuth misuse | Authorization-code flow with PKCE, exact HTTPS redirect URI registration, server-side state verification, narrow scopes, encrypted token storage, and revocation. | OAuth and redirect-negative tests. |
| Connector confused-deputy attack | Per-client consent before external authorization and consent bound to the requesting client. | Connector security review. |
| Sensitive-data over-retention | Minimise stored data, provide delete/export controls, and define retention by category. | Data-inventory and deletion tests. |
| Log leakage | Redact credentials, content classified as sensitive, and authorization values before event storage. | Log redaction tests. |

## Policy Enforcement

| Risk Class | Example | Default Policy |
| --- | --- | --- |
| Low | Summarising, drafting, inspecting local task metadata. | May run after normal request validation. |
| Medium | Creating a draft configuration or a non-public code branch. | Requires a visible task plan and scope confirmation. |
| High | Public publishing, production configuration changes, bulk messages. | Requires explicit approval immediately before the action. |
| Destructive | Deleting user data or revoking an integration. | Requires confirmation and a clear target description. |
| Financial | Spending, transfer, or payment action. | Not supported in the MVP. |

## Connected-App Requirements

MCP security guidance requires per-client consent, exact redirect-URI matching, and secure validation of short-lived OAuth state after approval. The connected-app implementation will remain blocked until the server-side implementation and integration-specific review can enforce these requirements. [1]

The current MVP implements the policy layer rather than a token-handling flow. It presents an approval sheet that names the provider, requested action, operation class, risk level, required scope category, and configuration state. Its server-side preflight returns `CONFIGURATION_REQUIRED` when a provider client ID, client secret, or fixed callback URI is absent, and it never opens an authorization session merely because a local approval was recorded. This design follows the authorization-code, CSRF, redirect, and token-in-URI safeguards in RFC 9700.[2]

## References

[1]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "MCP Security Best Practices"
[2]: https://datatracker.ietf.org/doc/rfc9700/ "RFC 9700: Best Current Practice for OAuth 2.0 Security"
