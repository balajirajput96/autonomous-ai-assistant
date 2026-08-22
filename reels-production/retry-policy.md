# Failure, Repair and Retry Policy

Each Reel ID remains permanent. A failed production attempt never authorizes replacement with a new ID, silent omission, or a completion claim without the required evidence.

| Failure class | Immediate action | Retry rule | Completion boundary |
| --- | --- | --- | --- |
| Source unsupported, contradictory or scope-unclear | Record the unsupported claim; rewrite the angle or move it to `needs_review`. | Retry research with higher-tier sources; do not script unsupported claims. | No voiceover or video is produced until a source record distinguishes evidence from theory, philosophy or belief. |
| Voice, caption or render error | Preserve the source/script record and log the exact stage. | Repair the artifact or renderer, then rerun technical QC. | A reel cannot advance past `qc_passed` without 9:16 video, audio stream and 55–65 second duration. |
| Media-generation quota or provider outage | Record the provider limit and current date/time in the manifest/progress record. | Do not loop retries. Use an explicitly labelled image-led fallback only if it still meets the claimed visual requirement; otherwise defer the reel. | A quota error is not a completed reel. |
| Drive upload failure | Keep local QC evidence and log the returned error. | Retry upload with the same final artifact; verify its final Drive folder using a read operation. | A reel is not `complete` until the verified upload record contains the Drive file ID and folder ID. |
| Local storage/checkpoint limit | Preserve verified Drive deliverables and manifests first. | Prune only local generated caches after informing the user; retain scripts, sources, captions, QC reports and Drive IDs. | Do not delete an unverified final deliverable. |

Every failure is recorded through the manifest pipeline with an attempt count, stage, technical detail, UTC timestamp and `needs_review` flag when factual or quality ambiguity remains. The next valid Reel ID is selected only from `progress.json` after all prior statuses are inspected.
