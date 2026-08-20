# Keyboard Navigation Shortcuts

Keyboard shortcuts are available only in the web build, where a physical keyboard and browser key events are present. Native iOS and Android touch navigation remains unchanged.

| Shortcut | Destination or Action | Safeguard |
| --- | --- | --- |
| `1` | Chat | Ignored whenever focus is in an editable field. |
| `2` | Activity | Ignored whenever focus is in an editable field. |
| `3` | Workspace | Ignored whenever focus is in an editable field. |
| `4` | Settings | Ignored whenever focus is in an editable field. |
| `?` | Open shortcut help | Ignored in editable fields and when browser/platform modifier keys are held. |
| `Escape` | Close shortcut help | Only acts while the help surface is open. |

The listener ignores keyboard events originating from `input`, `textarea`, `select`, or content-editable DOM elements, as well as events with Control, Command, Alt, or other modifier-key combinations. Therefore, typing in the Chat composer and normal browser shortcuts remain available. The help surface is announced as a modal dialog and documents the web-only boundary.
