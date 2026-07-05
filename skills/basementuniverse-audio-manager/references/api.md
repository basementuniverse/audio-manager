# API Reference

## Package

```ts
import {
  AudioManager,
  AudioItem,
  AudioBufferLoader,
  AudioElementLoader,
  PlayMode,
  AudioStatus,
  type AudioOptions,
} from '@basementuniverse/audio-manager';
```

## AudioManager

Static singleton entrypoint.

### Initialise

```ts
AudioManager.initialise(soundsConfig: Record<string, AudioOptions>): void;
```

Must be called before using other `AudioManager` methods.

### State Accessors

```ts
AudioManager.sounds: Record<string, AudioItem>;
AudioManager.globalVolume: number;
AudioManager.globalPan: number;
AudioManager.globalPitch: number;
AudioManager.globalMuted: boolean;
```

### Sound Registration

```ts
AudioManager.add(name: string, options: AudioOptions): void;
AudioManager.remove(name: string): void;
```

### Individual Sound Controls

```ts
AudioManager.play(name: string): void;
AudioManager.pause(name: string): void;
AudioManager.resume(name: string): void;
AudioManager.stop(name: string): void;
AudioManager.reset(name: string): void;
AudioManager.fadeIn(name: string, duration: number): void;
AudioManager.fadeOut(name: string, duration: number): void;
```

### Batch Controls

```ts
AudioManager.playAll(groupName?: string): void;
AudioManager.pauseAll(groupName?: string): void;
AudioManager.resumeAll(groupName?: string): void;
AudioManager.stopAll(groupName?: string): void;
AudioManager.resetAll(groupName?: string): void;
```

### Global/Group Settings

```ts
AudioManager.setVolume(volume: number, groupName?: string): void;
AudioManager.setPan(pan: number, groupName?: string): void;
AudioManager.setPitch(pitch: number, groupName?: string): void;
AudioManager.setMuted(muted: boolean, groupName?: string): void;
```

## AudioItem

Represents a registered sound instance.

### Properties

```ts
status: AudioStatus; // readonly getter
hold: boolean;
group?: string;
mode: PlayMode;
volume: number;
pan: number;
pitch: number;
loop: boolean;
onStart?: () => void;
onFinish?: () => void;
onRepeat?: () => void;
```

### Methods

```ts
play(): void;
pause(): void;
resume(): void;
stop(): void;
reset(): void;
fadeIn(duration: number): void;
fadeOut(duration: number): void;
updateProperties(): void;
```

## Loaders

### AudioBufferLoader

```ts
AudioBufferLoader(url: string): Promise<AudioBuffer>;
```

Loads and decodes to `AudioBuffer` using Web Audio API.

### AudioElementLoader

```ts
AudioElementLoader(url: string): Promise<HTMLAudioElement>;
```

Loads via `new Audio()` and resolves when playable.
