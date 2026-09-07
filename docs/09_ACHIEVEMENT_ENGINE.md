# Achievement Engine

## Examples
- Explorer: visit 3 zones.
- World Traveller: visit all zones.
- Challenger: complete 5 experiences.
- Speedster: complete 3 experiences within a period.
- Social Butterfly: interact with multiple experience centers.
- VIBE Legend: reach highest level.

## Engine
Achievements use condition_type + condition_config.

Evaluate only relevant achievements after an event.

## Unlock
Insert user_achievements once. Duplicate unlock attempts are harmless.

## UX
On unlock, return an achievement payload so the client can display a lightweight celebration.

## Security
Achievement unlock is server-generated. Client cannot claim an achievement directly.
