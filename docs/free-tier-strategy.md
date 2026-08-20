# Free-Tier Strategy

## Principle

The product is designed to be useful with modest usage and to degrade clearly when optional processing is unavailable. It must never assume that an external provider remains free, that a user has unlimited tokens or storage, or that persistent execution is included in a mobile runtime.

## Service Strategy

| Service Category | Preferred MVP Approach | Authentication | Cost / Quota Risk | Fallback |
| --- | --- | --- | --- | --- |
| Mobile UI and local preferences | Device-local storage and managed mobile runtime. | None for local-only features. | Low, device capacity bounded. | Clear local-storage quota message. |
| AI conversation | Server-side managed model adapter with usage error handling. | Server configuration only. | Variable; model usage can be quota-limited. | Surface limit, allow later retry, and offer a non-AI local UI state. |
| Voice transcription | Server-side transcription only after a valid audio upload. | Server configuration only. | Variable and file-size bounded. | Let user type; retain no false “transcribing” state. |
| Files | Server-side object storage only when attachment processing is activated. | User session and server authorization. | Storage and transfer cost may grow. | Local selection indicator; disable remote processing when unavailable. |
| Research | Citation-first server workflow. | Provider / search authorization may be required. | Variable request cost and rate limits. | Explain that research is unavailable; never fabricate citations. |
| Persistent automation | Server worker only after explicit operational deployment. | User-approved connector and policy. | May incur hosting and provider usage. | Manual task execution from the app. |

## Quota Behaviour

| Condition | User-Facing Behaviour | System Behaviour |
| --- | --- | --- |
| Provider unavailable | “The assistant service is temporarily unavailable.” | Record a non-sensitive failure category and offer retry. |
| Quota exhausted | “The configured processing limit has been reached.” | Stop retries that cannot succeed; preserve the request as a draft. |
| Network failure | “Connection interrupted. Try again when online.” | Mark task as retryable only when doing so is policy-safe. |
| Unsupported modality | “This processing mode is not enabled.” | Do not substitute an unrelated provider without user-visible disclosure. |

## Architecture Decision

Client-side API secrets are not a free-tier optimisation; they are a security liability. The managed backend helper is the right location for AI requests because it retains credentials server-side. A future provider selection screen will expose availability and quota status but will not show or store raw provider secrets in the client.
