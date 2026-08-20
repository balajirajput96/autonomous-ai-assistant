# Verified MVP Status

## What Is Implemented

The current mobile MVP provides a functional AI workspace rather than a simulated agent dashboard. Users can send a text request through a server-side model route, see a locally persisted task trace, switch between assisted and agent-planning modes, review activity, manage local history, and use settings to control task persistence and device speech output. The server route selects an available text model at runtime and keeps provider credentials outside the mobile client.

| Capability | Verified Behaviour | Data Boundary |
| --- | --- | --- |
| **Text conversation** | A live server-side `gpt-5-mini` smoke test returned `OK` through the assistant route. | Prompt and response are processed by the built-in server-side model service; no model credential is bundled into the app. |
| **Task trace and risk status** | Each request receives visible steps, a state, and a risk label. Consequential patterns pause before model processing. | Task data is held in device-local storage when task history is enabled. |
| **Activity and workspace** | The user can review local records and clear locally stored conversation and task data. | Clearing removes the persisted local messages and task records. |
| **Attachments** | A system document picker accepts supported documents and images and displays a local queue state. | No selected file is uploaded or sent to a model in this MVP. |
| **Voice interaction** | Microphone capture requests permission only after a user tap; device text-to-speech is optional. | Audio is not uploaded or transcribed in this MVP. |
| **Connected tools and schedules** | The application clearly displays these as planned capabilities. | There are no hidden connector credentials, background workers, or unaudited external actions. |
| **Connector approval foundation** | GitHub, Google Calendar, and Gmail cards present provider boundaries and one-time local approval sheets. A server preflight returns `CONFIGURATION_REQUIRED` without provider credentials and a callback domain. | No provider page is opened, scope is granted, account is connected, or token is collected in this MVP. |
| **Connection management settings** | Settings lists every configured provider record with an explicit lifecycle status, account field, access summary, and appropriate management control. Local approvals can be removed with confirmation. | The current build cannot falsely revoke active OAuth tokens: actual revocation stays unavailable until a verified server token and provider transaction exist. |
| **Active connection sync controls** | Future active records show **Last Synced**, sync status, and **Sync Now**. | The button explains that no provider refresh can run until an authenticated server-side token and sync service are configured; it never invents a sync timestamp. |
| **Sync-failure alerts** | Rate-limit and expired-token failure records have distinct recovery guidance, persist locally, can be marked read, and may send an opt-in local device alert. | No failure is fabricated. Remote push delivery requires a production build, permission, device token registration, and a verified server-side sync event. |
| **Device push-token registration** | Settings can request notification permission and acquire a native token on a physical device, then display only a redacted readiness state. Token rotation is observed while alerts are enabled. | The raw token is neither displayed, locally persisted, logged, nor uploaded. Background remote delivery remains pending until an authenticated server-registration and deletion path exist. |
| **Local test notification** | Settings can send an immediate test alert through the device’s sync-failure notification channel and report permission, native-environment, or scheduling failures. | This checks only local delivery. It does not use a push token, contact a push provider, or prove that background remote delivery is configured. |
| **Focused usability pass** | Chat offers editable starter prompts, Activity provides status filters, and notification controls show clearer disabled states when alerts are not enabled. | Starter prompts do not send automatically, activity filters do not alter history, and notification controls remain unavailable until the user opts in. |
| **Accessibility preferences** | Settings provides persistent Standard, Large, and Extra large text choices plus a high-contrast palette. Chat, Activity, Settings, shared screen backgrounds, and navigation colours respond to the selected preferences. | The options change only this app’s presentation and preserve device-level accessibility scaling; they do not change operating-system settings or external provider surfaces. |

## Intentional MVP Boundaries

The assistant does not claim to execute external actions, connect private accounts, publish content, alter third-party data, perform financial transactions, or retain uploaded files. Tool execution, scheduled workflows, production OAuth, document intelligence, and speech transcription require the independent security, retention, approval, and operational work described in the release plan.

The current validation evidence consists of TypeScript checking, three deterministic domain tests, linting, a successful Expo configuration resolution, an icon asset review, and a server-side AI endpoint smoke test. Device-level permission and lifecycle tests remain required before any store submission.
