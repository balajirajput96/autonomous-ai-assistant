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

## Intentional MVP Boundaries

The assistant does not claim to execute external actions, connect private accounts, publish content, alter third-party data, perform financial transactions, or retain uploaded files. Tool execution, scheduled workflows, production OAuth, document intelligence, and speech transcription require the independent security, retention, approval, and operational work described in the release plan.

The current validation evidence consists of TypeScript checking, three deterministic domain tests, linting, a successful Expo configuration resolution, an icon asset review, and a server-side AI endpoint smoke test. Device-level permission and lifecycle tests remain required before any store submission.
