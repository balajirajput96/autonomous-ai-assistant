# Autonomous AI Assistant

Autonomous AI Assistant is an Expo-based mobile workspace that combines chat, visible task traces, approval-first connector foundations, and accessible interaction controls. The current release is an MVP: it emphasises transparent local state, explicit approval boundaries, and honest capability status rather than simulating unauthorised external actions.

## Verified Features

| Area | Included in the MVP |
| --- | --- |
| **AI workspace** | Server-side text responses, visible task states, risk labels, local activity history, and editable starter prompts. |
| **Connections** | Approval-first GitHub, Google Calendar, and Gmail connection records, with configuration-safe OAuth preflight and local approval removal. |
| **Sync feedback** | Last-sync state, rate-limit and expired-token alert records, opt-in local notifications, device-token readiness, and local test notifications. |
| **Accessibility** | Text-size preferences, high-contrast colours, native screen-reader semantics, web keyboard navigation, and shortcut help. |
| **Safety boundary** | No provider OAuth token, selected attachment, external tool action, or remote push notification is fabricated by the app. |

## Local Development

Install the project dependencies and start the Expo development services:

```bash
pnpm install
pnpm dev
```

Run validation before contributing changes:

```bash
pnpm check
pnpm test
pnpm lint
```

## Keyboard Navigation

In the web build, use `1` through `4` to open Chat, Activity, Workspace, and Settings. Press `?` to open shortcut help and `Escape` to close it. Shortcuts are ignored while an editable field has focus and when browser/platform modifier keys are held.

## Production Boundaries

This repository intentionally does not include provider OAuth credentials, raw device push tokens, or user attachments. Production OAuth sync, encrypted token storage, document processing, server-side speech transcription, and remote push delivery require their own authenticated backend endpoints, provider configuration, and consent/retention controls. See [`docs/`](docs/) for the product, architecture, security, privacy, accessibility, OAuth, and release documentation.

## Mobile Release

The project uses the managed mobile release flow. Create a project checkpoint, then use the **Publish** action in the project interface to trigger the managed build and generate the APK. Do not attempt to build the APK manually in the local sandbox.
