# Quest Engine

## Goal
Provide configurable event-wide objectives.

## Condition types
MVP:
- zones_visited
- experiences_completed
- specific_experience
- coins_earned
- time_window_completions
- all_zones_completed

## Condition config examples

```json
{"target":3}
```

```json
{"experience_id":"uuid"}
```

```json
{"window_minutes":60,"target":3}
```

## Trigger model
Do not run a full scan of every quest after every action.

After a relevant event:
1. identify potentially affected quest types
2. update progress
3. if threshold reached, mark complete
4. award configured reward once

## Idempotency
Quest reward must have a unique completion constraint.

## Admin
Quest builder should expose human-friendly fields while storing normalized condition_config.
