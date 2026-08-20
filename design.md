# Autonomous AI Assistant — Mobile Interface Design

## Product Direction

The application is a mobile-first AI workspace for normal users who want a simple chat experience while retaining controlled access to tools, files, research, and task automation. The interface uses a **portrait 9:16 layout** with a reachable primary action zone at the bottom, progressive disclosure for advanced controls, and native-platform conventions such as tab navigation, sheets, clear permission prompts, and persistent task state.

The initial release is an MVP. It will provide a verified conversational interface, local task tracking, attachment entry points, an approval-oriented agent mode, and explicit availability states. External services, long-running automations, MCP connections, GitHub write actions, and cloud synchronization will remain visibly scoped as future integrations until their authentication, security, and runtime requirements are verified.

## Screen List

| Screen | Primary Content and Functionality |
| --- | --- |
| **Chat** | Conversation timeline, status chip, attachment entry point, microphone shortcut, prompt composer, and an agent-mode toggle. It is the default landing screen and supports one-handed sending. |
| **Task Detail Sheet** | A bottom sheet that exposes the active task's intent, step status, approval requirement, outputs, and error state without moving the user away from chat. |
| **Activity** | A chronological, searchable record of completed, running, blocked, and cancelled tasks. Each row exposes the task risk level and has a route to its detail view. |
| **Workspace** | A compact overview of saved memory preferences, uploaded files, and available connector placeholders. Destructive actions are isolated behind a confirmation surface. |
| **Settings** | Theme, speech preferences, data controls, permission explanations, and a clear distinction between device-local data and optional third-party processing. |
| **Research Result** | A focused reading layout for sourced research responses, separating verified sources from model inferences and uncertain claims. This is planned for a later implementation increment. |
| **Connectors and Automation** | A future capability screen for authorised integrations, workflow status, health checks, schedules, and revocation. It will not present unauthenticated actions as operational. |

## Primary User Flows

| Flow | Steps |
| --- | --- |
| **Ask for help** | User opens Chat → writes or dictates a request → taps Send → sees a running task status → reads the response → optionally opens Task Detail for execution trace. |
| **Use agent mode safely** | User enables Agent Mode → submits a request → app classifies it as low, medium, high, or external-publish risk → low-risk steps can proceed locally → any higher-risk action is paused pending an explicit approval flow. |
| **Attach supporting material** | User taps Attach → picks a document or image → app confirms the file is queued → user submits a prompt that references it → the task shows a visible processing state and source attribution when available. |
| **Review or clear saved context** | User opens Workspace → reviews saved preferences and recent files → selects an item → deletes it via a confirmation action → sees a success state with the updated record. |
| **Diagnose an unavailable capability** | User selects an integration or scheduled-workflow function that is not configured → sees an honest, contextual explanation of the dependency and an available fallback rather than a non-functional control. |

## Layout and Interaction Principles

The Chat screen prioritizes the conversation and the composer. The top area contains a compact assistant identity and current safety mode. Messages occupy a vertically scrolling reading column, while the composer stays in the bottom thumb-reach zone. Voice, attach, and send controls use familiar icon-only targets with labels exposed to accessibility services. Task progress is communicated in text and shape, not colour alone.

Activity and Workspace use high-signal card rows with no more than two secondary actions visible at a time. Advanced information, such as tool logs and policy metadata, appears within a disclosure sheet. The design avoids falsely implying that unavailable backend, connector, or external-account actions are live.

## Color Choices

| Token | Light | Dark | Intended Meaning |
| --- | --- | --- | --- |
| **Ink** | `#10212B` | `#EAF2F5` | Primary reading text and stable navigation chrome. |
| **Cloud** | `#F6F8F8` | `#0E1519` | Calm application background that supports long conversations. |
| **Panel** | `#FFFFFF` | `#172329` | Elevated cards, composer, and sheets. |
| **Signal Teal** | `#007C7A` | `#45C7BE` | Primary actions, active agent state, and positive momentum. |
| **Focus Blue** | `#2459E0` | `#8BA8FF` | Links, cited-source affordances, and informational states. |
| **Caution Amber** | `#A84E00` | `#FFBB6A` | Approval-required and limited-capability status. |
| **Alert Red** | `#BB2C36` | `#FF959A` | Errors and destructive confirmations. |

## Accessibility and Platform Standards

The app will respect system light and dark appearance, use dynamic text-friendly layout spacing, retain readable contrast, and provide semantic labels for every icon action. All task states will be conveyed through text in addition to colour. Destructive and external actions will require clear confirmation, and bottom controls will remain above the Android system navigation area.
