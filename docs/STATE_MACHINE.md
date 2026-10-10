# State Machine

The current engine exposes an explicit phase field and a pure reducer boundary:

```text
nextState = reduceGame(currentState, command, rng)
```

Milestone 0 behavior is intentionally strict:

1. Reject a command whose `expectedStateVersion` differs from the authoritative state.
2. Reject all gameplay commands as `COMMAND_NOT_IMPLEMENTED`.
3. Never let the browser mutate authoritative state directly.

The future phase sequence from the product brief is reserved, but transitions are not implemented early because doing so would encode unverified rules. Milestone 2 begins with lobby/setup transitions; Milestone 3 adds one vanilla round.
