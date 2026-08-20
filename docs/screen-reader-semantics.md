# Screen-Reader Semantic Coverage

The implementation uses React Native’s native accessibility properties rather than web-only markup. It adds a dedicated label when visible text is ambiguous, a semantic role for controls and headers, a selected/disabled state for segmented controls and unavailable actions, and a concise hint when a control changes data, opens a sheet, or has a prerequisite. Dynamic task and sync states are exposed as polite live regions on Android, while visible text remains available for all platforms.

| Area | Semantics Added | Outcome |
| --- | --- | --- |
| **Chat** | Header role, selected execution-mode state, descriptive attachment/microphone/send labels and hints, and polite running-task status. | Users can understand how to compose and submit a request without inferring icon meaning. |
| **Activity** | Header role, selected task-filter state, and task-card button labels/hints containing task state and risk. | Users can move directly to attention-required or completed work and open a trace with context. |
| **Settings** | Named switches, text-size tab states, disabled state and prerequisites for device controls, and named alert actions. | Users can change accessibility, notification, and connection preferences without relying on card layout or colour. |
| **Task details** | Modal containment and semantic step/status descriptions. | The task trace is announced as a focused temporary surface rather than background content. |

React Native documents `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityHint`, and Android live-region support as built-in accessibility properties; the implementation uses those native patterns rather than assuming HTML ARIA is the only available semantic layer.[1]

## Reference

[1]: https://reactnative.dev/docs/accessibility "Accessibility — React Native"
