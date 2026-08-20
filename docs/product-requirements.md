# Product Requirements

## Product Definition

**Autonomous AI Assistant** is a mobile AI workspace that lets a user hold a conversation, attach supporting material, track a task, and selectively enable agent-style execution. The product must keep the main chat experience understandable to a first-time user while making risk, processing state, external data transfer, and approval requirements visible.

The implementation baseline is **React Native with Expo and TypeScript**, because that is the available managed Android project template. This differs from the requested Kotlin and Jetpack Compose preference. The architecture will preserve platform-independent product and server contracts so that a native Kotlin client can be introduced later without rewriting the orchestration model.

## Target Users and Primary Use Cases

| User | Need | Verified MVP Outcome |
| --- | --- | --- |
| Everyday assistant user | Ask questions and manage personal tasks without navigating a complex agent system. | A focused chat interface with transparent task status. |
| Knowledge worker | Bring a document or image into a conversation and maintain context. | Attachment entry points and a visible processing-state model. |
| Cautious power user | Ask an agent to plan a multi-step task while preserving control of consequential actions. | Risk labelling, an approval boundary, and task records. |
| Privacy-aware user | Understand what stays on the device and what is sent for processing. | Data controls, plain-language disclosures, and deletion affordances. |

## Functional Scope

| Capability | MVP Requirement | Current Delivery State |
| --- | --- | --- |
| Chat | User can create a task from text, view progress, and read a response. | In implementation. |
| Local task history | Tasks retain an identifier, state, timestamps, outputs, and errors. | In implementation. |
| Agent safety mode | Agent requests have a low, medium, high, destructive, or external-publish classification. High-risk operations require a future explicit approval flow. | In implementation as policy-aware UI and data model. |
| Attachments | User can select a document or image and see whether processing is available. | Planned after core chat. |
| Server-side AI | Requests are handled through a backend adapter, not a client-side API secret. | Planned after core chat. |
| Voice | Microphone capture, transcription, and speech playback respect permissions and availability. | Planned. |
| Connected apps and MCP | Connections show provider, tools, permissions, health, and revocation status. | Architecture only until authenticated integration is verified. |
| Automation | Persistent workflows run only in a verified server environment; the mobile app is a control plane, not a promise of 24/7 execution. | Architecture only. |

## Non-Goals for the MVP

The MVP will not represent unauthenticated connector actions, GitHub writes, autonomous publishing, financial actions, unlimited storage, unlimited model access, or 24/7 background execution as working capabilities. It will not embed user-provided API keys in the Android application. It will not claim full production readiness until release gates, testing, provider health, and policy reviews have been verified.

## Acceptance Criteria

| Area | Acceptance Criterion |
| --- | --- |
| Usability | A user can submit a text request and identify its state without leaving the Chat screen. |
| Safety | Every action has a state and risk level; unavailable actions state their dependency rather than appearing to succeed. |
| Reliability | Provider, network, and file-processing failures return an actionable error surface instead of crashing the application. |
| Privacy | The product provides understandable statements of local storage, third-party processing, retention, deletion, and export boundaries. |
| Accessibility | Icon actions have accessible labels; state is not conveyed through colour alone; dynamic text and system appearance are respected. |

## External Requirements

The release build must target Android 16 / API 36 or higher for a new Play submission after 31 August 2026. Google Play requires transparent disclosure of user-data handling, and the developer remains responsible for third-party AI integrations. [1] [2]

## References

[1]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en "Target API level requirements for Google Play apps"
[2]: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en "User Data — Play Console Help"
