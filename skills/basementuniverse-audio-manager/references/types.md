# Type Reference

## AudioOptions

```ts
type AudioOptions = {
  audio: HTMLAudioElement | AudioBuffer;
  group?: string;
  mode: PlayMode;
  volume: number;
  pan: number;
  pitch: number;
  loop: boolean;
  onStart?: () => void;
  onFinish?: () => void;
  onRepeat?: () => void;
};
```

## PlayMode

```ts
enum PlayMode {
  Trigger = 'trigger',
  Retrigger = 'retrigger',
  Hold = 'hold',
}
```

### PlayMode Semantics

- `trigger`: play once; ignore `play()` while already playing
- `retrigger`: restart from beginning when `play()` is called while playing
- `hold`: playback starts/stops based on `AudioItem.hold`

## AudioStatus

```ts
enum AudioStatus {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
}
```

## Practical Constraints

- `volume` is expected in range `0..1`
- `pan` is expected in range `-1..1`
- `pitch` uses playback-rate semantics (`1` is normal)
- `fadeIn/fadeOut` duration is in seconds
