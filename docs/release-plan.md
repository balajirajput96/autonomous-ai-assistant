# Release Plan

## Release Strategy

The application will advance only when its verified state matches its user-facing claims. The initial milestone is a controlled mobile MVP. It is not a claim that provider integrations, autonomous workflows, connected apps, storage deletion, or Play submission are ready.

| Milestone | Scope | Required Evidence |
| --- | --- | --- |
| **M0: Foundation** | Mobile design, task state model, documentation, and branding. | **Implemented**, pending final custom-icon asset propagation and final validation. |
| **M1: Chat MVP** | Chat composer, task lifecycle UI, history, settings, and local memory controls. | **Implemented** with local persistence, safety labels, a task trace, and deterministic domain tests. |
| **M2: Remote Processing** | Server-side AI, attachments, transcription, and error handling. | **Partially implemented**: the server-side text model route and safe provider errors are verified; attachment selection and audio capture remain local-only; upload, document intelligence, and transcription are intentionally blocked pending consent and retention controls. |
| **M3: Controlled Tools** | Tool registry, policy engine, approval flow, audit log, and selected connector read operations. | Risk-policy, OAuth, tool-schema, and adversarial tests. |
| **M4: Durable Workflows** | Server worker, schedules, monitoring, cancellation, and owner alerts. | Queue, retry, cancellation, and operational health tests. |
| **M5: Play Candidate** | Store materials, privacy policy, data safety declarations, and signed build. | All release gates below marked as verified. |

## Google Play Release Gates

| Gate | Status Today | Required Before Submission |
| --- | --- | --- |
| Android target API | Not yet verified against a signed production build. | Target Android 16 / API 36 or later for new apps and updates after 31 August 2026. [1] |
| Data disclosures | Documentation drafted; console declaration not started. | Complete Data Safety, privacy policy, permission explanations, and third-party AI disclosure. [2] |
| Permissions | Microphone permission is requested only after the user starts voice capture; document selection uses the platform picker. | Test permission denial, re-grant, and configuration behavior in a generated Android build. |
| Security and privacy | Provider keys remain server-side; consequential risk labels pause local tasks. | Perform secret, logging, retention, deletion, upload, and connector security validation before broader data processing. |
| Functional quality | Chat, local state, settings, capability status, local attachment selection, device speech, and server-side text responses are implemented. | Pass final automated checks and realistic device interaction tests, including network loss and permission-denial paths. |

## Definition of Production Readiness

No release is considered production-ready unless the build, automated tests, security review, privacy review, server health, model-provider health, enabled connector tests, workflow tests, offline behaviour, and Play policy checks have each been independently verified. An unverified control is a blocker, not a silent exception.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en "Target API level requirements for Google Play apps"
[2]: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en "User Data — Play Console Help"
