---
name: basementuniverse-audio-manager
description: >
  Use this skill when implementing or modifying browser-game audio with
  @basementuniverse/audio-manager, including setup, playback control,
  grouping, fades, and content-manager loaders.
---

# Basement Universe Audio Manager

Use this skill when working with `@basementuniverse/audio-manager`.

This library wraps Web Audio API primitives for common game-audio workflows:

- Register named sounds (`HTMLAudioElement` or `AudioBuffer`)
- Play/pause/stop/reset individual sounds
- Control all sounds or a named group
- Apply volume/pan/pitch/mute settings
- Use trigger/retrigger/hold playback modes
- Load audio through content-manager loaders

## When To Use

Use this skill when you need to:

- Add or update sound effects/music in a browser game
- Refactor code that manages named sound maps
- Integrate `@basementuniverse/content-manager` loaders for audio assets
- Debug behavior differences between `AudioBuffer` and `HTMLAudioElement`
- Implement group-level controls (e.g. `music`, `sfx`, `ambience`)

## Quick Start

```ts
import { AudioManager, PlayMode } from '@basementuniverse/audio-manager';

AudioManager.initialise({
  music: {
    audio: new Audio('/audio/music.mp3'),
    group: 'music',
    mode: PlayMode.Trigger,
    volume: 0.6,
    pan: 0,
    pitch: 1,
    loop: true,
  },
  jump: {
    audio: jumpBuffer,
    group: 'sfx',
    mode: PlayMode.Retrigger,
    volume: 0.9,
    pan: 0,
    pitch: 1,
    loop: false,
  },
});

AudioManager.play('music');
AudioManager.play('jump');
```

## Agent Guidance

- Always ensure `AudioManager.initialise(...)` has run before calling static methods.
- Use `PlayMode.Hold` only when gameplay logic actively toggles `sound.hold`.
- After directly mutating `AudioItem.volume`, `AudioItem.pan`, or `AudioItem.pitch`, call `sound.updateProperties()`.
- Prefer group-scoped controls for game settings menus.
- Use `AudioElementLoader` for local `file://` workflows; use `AudioBufferLoader` on `http/https`.

## Behavioral Notes

- `AudioBufferSourceNode` is recreated on each play. This is expected Web Audio behavior.
- Pausing an `AudioBuffer`-backed sound effectively stops it; resume restarts from the beginning.
- `setVolume/setPan/setPitch/setMuted` without a group updates ungrouped sounds directly.
- Group-scoped setters update only sounds in that group.

## References

- Public API surface: [references/api.md](references/api.md)
- Type reference: [references/types.md](references/types.md)
- Runtime behavior and gotchas: [references/behaviors.md](references/behaviors.md)
