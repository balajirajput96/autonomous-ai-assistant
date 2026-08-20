# Accessibility Preference Model

## Text-Size Choices

The app will retain native text scaling and add three local presentation choices: **Standard** (`1.00×`), **Large** (`1.15×`), and **Extra large** (`1.30×`). These choices apply to primary reading text, headings, controls, task rows, and composer content on the app’s core screens. They are deliberately moderate so the portrait layouts remain functional, while users can continue to use their device’s broader display and accessibility scaling.

| Preference | Scale | Intended Use |
| --- | --- | --- |
| **Standard** | `1.00×` | Default compact reading experience. |
| **Large** | `1.15×` | More comfortable everyday reading. |
| **Extra large** | `1.30×` | Improved readability without hiding core controls. |

The design preserves reflow and avoids fixed-width text-only containers. W3C guidance requires that text can be resized to 200% without loss of content or functionality, and cautions against layouts that clip, overlap, or make text unusable as scale increases.[1]

## High-Contrast Mode

High-contrast mode uses explicit near-black/white surfaces, stronger borders, and higher-separation semantic colours while preserving the existing status meanings. It is a presentation option, not a claim that every third-party or device-controlled surface has been recoloured. Normal text uses a high-separation foreground/background pair, and the app preserves textual state labels rather than relying on colour alone.

W3C’s minimum contrast criterion specifies at least 4.5:1 for normal text and 3:1 for large text; its enhanced guidance describes 7:1 for normal text as a stronger target.[2]

| Token | High-contrast light | High-contrast dark |
| --- | --- | --- |
| **Background / surface** | `#FFFFFF` | `#000000` |
| **Primary text / border** | `#000000` | `#FFFFFF` |
| **Secondary text** | `#1C1C1E` | `#E6E6E6` |
| **Interactive accent** | `#005A58` | `#53E5DB` |

## Persistence and Boundary

Both preferences are saved with the device-local assistant preferences. They affect only this application’s own presentation and can be changed or reverted at any time in Settings. They do not modify device accessibility settings, OAuth data, notification permissions, or external provider surfaces.

## References

[1]: https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html "Understanding Success Criterion 1.4.4: Resize Text — W3C WAI"
[2]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html "Understanding Success Criterion 1.4.3: Contrast (Minimum) — W3C WAI"
