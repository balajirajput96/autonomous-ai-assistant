# Connector Approval-Sheet Flow

The connector workflow follows **review before consent** rather than opening a provider authorization page from an ambiguous icon tap. The Workspace screen displays a provider card in its genuine state. Selecting **Review connection** opens a bottom sheet that names the provider, purpose, scope category, operation class, risk level, and current configuration requirement.

| User Step | Interface Response | External Effect |
| --- | --- | --- |
| User selects a provider card | The app opens the approval sheet. | None. |
| User reviews provider, scope category, and action | The app presents the exact boundary and limitation. | None. |
| User records approval | The app records one local approval request and identifies the connection as pending configuration. | None. |
| A production OAuth client is later configured | The server may create a PKCE-backed authorization request after validating the provider configuration and user identity. | The user is redirected to the provider only after the server-side prerequisites are verified. |
| User proposes a write, publish, or destructive action | The approval sheet must be shown again with action-specific detail. | No action is issued in the current MVP. |

The sheet uses a neutral confirmation such as **“Record approval”** when no valid OAuth client exists. It must not use a misleading **“Connect”** label that implies a completed integration. After the application receives a verified provider callback in a future production increment, the same component may change to **“Continue to provider”** and launch the system authorization session.
