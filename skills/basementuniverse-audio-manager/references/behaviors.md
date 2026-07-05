# Runtime Behaviors And Gotchas

## Initialisation Guard

Most static methods throw `Error('AudioManager not initialised')` if
`AudioManager.initialise(...)` has not run yet.

## Source-Type Differences

### AudioBuffer-backed sounds

- A new `AudioBufferSourceNode` is created each play.
- `pause()` internally stops playback; `resume()` restarts from beginning.
- Good for short SFX where exact resume position is not required.

### HTMLAudioElement-backed sounds

- Reuses a `MediaElementAudioSourceNode`.
- `pause()` and `resume()` behave as expected for media elements.

## Hold Mode

For `PlayMode.Hold`, calling `play()` does nothing unless `hold === true`.
Typical control pattern:

```ts
const engine = AudioManager.sounds['engine'];
engine.hold = true;  // start
engine.hold = false; // stop
```

## Group vs Global Setters

- `setVolume/setPan/setPitch/setMuted` with `groupName` affects that group only.
- Calling these without `groupName` updates ungrouped sounds directly.
- Grouped sounds keep their own settings unless explicitly targeted by group.

## Property Mutation

If you mutate `sound.volume`, `sound.pan`, or `sound.pitch` directly, call:

```ts
sound.updateProperties();
```

This pushes values into the underlying Web Audio nodes.

## Loader Selection

- Use `AudioBufferLoader` when running over `http/https`.
- Use `AudioElementLoader` for local filesystem (`file://`) compatibility.
