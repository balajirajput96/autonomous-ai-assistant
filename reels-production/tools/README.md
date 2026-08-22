# Production Tool Usage

`reel_pipeline.py` is intentionally deterministic. It does not generate claims, images, audio, captions, or Drive uploads; it protects the production record around those steps.

```bash
python3 reels-production/tools/reel_pipeline.py init Reel_0001 \
  --title "रटने से ज़्यादा असरदार क्या है?" \
  --topic "distributed practice" \
  --claim-type "empirical learning research" \
  --source-record reels-production/research/Reel_0001_sources.md
```

After evidence, script, voice, and video assets are genuinely present, advance exactly one status at a time. A technical QC run checks a non-empty file, video and audio streams, 9:16 geometry, 55–65-second duration, and SHA-256. It emits a failure rather than claiming success when a check fails.
