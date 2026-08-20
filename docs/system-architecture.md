# System Architecture

## Architecture Objective

The system separates a mobile user experience from confidential server operations and extensible execution services. The mobile application is responsible for input, presentation, local preferences, explicit consent, and task monitoring. The server is responsible for model invocation, policy checks, tool validation, audit records, connector tokens, and any approved long-running orchestration.

| Layer | Responsibility | Prohibited Responsibility |
| --- | --- | --- |
| **Mobile client** | Chat, task state views, permission prompts, device-local preferences, attachment selection, explicit approvals. | Holding provider secrets, directly executing privileged connector calls, or promising persistent autonomous work. |
| **Assistant API** | Request validation, provider abstraction, conversation assembly, response shaping, error normalization. | Bypassing risk policy or treating a model response as an execution authority. |
| **Agent orchestrator** | Intent classification, plan creation, tool selection, state transitions, retries, audit event emission. | Executing tools without validation or invoking high-risk actions without approval. |
| **Tool gateway** | JSON-schema validation, allowlists, timeout and retry policy, permission checks, redacted result logging. | Allowing arbitrary shell commands, unrestricted URLs, or silent external publishing. |
| **Connector service** | OAuth lifecycle, least-privilege scopes, health checks, revocation, and server-side encrypted token storage. | Shipping tokens to the client or trusting an MCP server by default. |
| **Durable worker** | Approved schedules, workflow queues, retries, and notification events. | Running unbounded device-resident background jobs. |

## Task Lifecycle

```text
User request
  → Validate and classify intent
  → Create task: QUEUED
  → Plan: PLANNING
  → Execute permitted steps: RUNNING
  → Await consent or external prerequisite: WAITING / BLOCKED
  → Retry bounded transient failures: RETRYING
  → Produce response and audit event: COMPLETED / FAILED / CANCELLED
```

Each task carries an immutable task identifier, user-visible summary, state, risk level, timestamps, bounded retry count, redacted tool events, estimated usage, output, and error category. The first implementation will render these records locally; a future authenticated backend can synchronize them without changing the user-facing contract.

## Provider and Tool Contracts

The backend will define original interfaces such as `TextModelProvider`, `VisionModelProvider`, `AudioModelProvider`, `EmbeddingProvider`, `ImageGenerationProvider`, and `ToolCallingProvider`. A provider adapter normalizes successful responses and known failure conditions—unavailable provider, exhausted quota, timeout, rate limit, invalid credentials, unsupported modality, and temporary network failure—into stable application errors.

Tool calls follow a structured application-controlled loop. A model may propose a tool name and arguments, but the server validates the contract, checks the policy, optionally seeks approval, executes the tool, records a redacted result, and then asks the model to construct a user-facing answer. The model does not execute external functions itself. [1]

| Tool Field | Required Behaviour |
| --- | --- |
| `name` and `description` | Identify an allowlisted, understandable capability. |
| `inputSchema` and `outputSchema` | Validate before execution and normalise results after execution. |
| `permissions` | Bind required scopes to the identity and connector that granted them. |
| `riskLevel` | Classify as low, medium, high, destructive, external-publish, or financial. |
| `timeout` and `retryPolicy` | Bound execution time and retry only transient safe failures. |
| `auditEvent` | Store a redacted event including timestamp, task ID, outcome, and approval reference. |

## Automation and Connected Services

The device can request work and schedule modest client synchronization, but it is not a durable substitute for server workers. Android describes WorkManager as reliable for deferred work that must survive app or device restarts but not as a universal solution for immediate execution. [2] Therefore, scheduled workflows and long-running agents are deferred until a server worker, persistence mechanism, and operational monitoring are verified.

MCP-connected services remain external trust boundaries. The future connector architecture includes per-client consent, exact redirect-URI validation, short-lived validated OAuth state, scope minimisation, tool discovery, health status, and a revoke action. [3]

## References

[1]: https://ai.google.dev/gemini-api/docs/function-calling "Function calling with the Gemini API"
[2]: https://developer.android.com/develop/background-work/background-tasks/persistent "Android Task Scheduling"
[3]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "MCP Security Best Practices"
