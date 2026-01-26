# Audio Manager - AI Documentation

TypeScript audio management library using Web Audio API. Supports HTMLAudioElement and AudioBuffer.

## Package Import
```typescript
import { AudioManager, AudioItem, PlayMode, AudioStatus, AudioBufferLoader, AudioElementLoader } from '@basementuniverse/audio-manager';
```

## Types

### AudioOptions
```typescript
type AudioOptions = {
  audio: HTMLAudioElement | AudioBuffer;
  group?: string;
  mode: PlayMode;
  volume: number;  // 0 to 1
  pan: number;     // -1 (left) to 1 (right)
  pitch: number;   // playback rate, 1 is normal
  loop: boolean;
  onStart?: () => void;
  onFinish?: () => void;
  onRepeat?: () => void;
};
```

### PlayMode Enum
```typescript
enum PlayMode {
  Trigger = 'trigger',      // Play once, ignore if already playing
  Retrigger = 'retrigger',  // Restart if already playing
  Hold = 'hold'             // Play while hold property is true
}
```

### AudioStatus Enum
```typescript
enum AudioStatus {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused'
}
```

## AudioManager Class (Static)

### Initialization
```typescript
AudioManager.initialise(soundsConfig: Record<string, AudioOptions>): void
```
Must be called before using AudioManager. Creates audio context and registers all sounds.

### Properties (Read-only)
```typescript
AudioManager.sounds: Record<string, AudioItem>
AudioManager.globalVolume: number
AudioManager.globalPan: number
AudioManager.globalPitch: number
AudioManager.globalMuted: boolean
```

### Sound Management
```typescript
AudioManager.add(name: string, options: AudioOptions): void
AudioManager.remove(name: string): void
```

### Individual Sound Control
```typescript
AudioManager.play(name: string): void
AudioManager.pause(name: string): void
AudioManager.resume(name: string): void
AudioManager.stop(name: string): void
AudioManager.reset(name: string): void
AudioManager.fadeIn(name: string, duration: number): void   // duration in seconds
AudioManager.fadeOut(name: string, duration: number): void  // duration in seconds
```

### Batch Control (All Sounds or Group)
```typescript
AudioManager.playAll(groupName?: string): void
AudioManager.pauseAll(groupName?: string): void
AudioManager.resumeAll(groupName?: string): void
AudioManager.stopAll(groupName?: string): void
AudioManager.resetAll(groupName?: string): void
```
Without groupName: affects all sounds. With groupName: affects only sounds in that group.

### Global/Group Settings
```typescript
AudioManager.setVolume(volume: number, groupName?: string): void
AudioManager.setPan(pan: number, groupName?: string): void
AudioManager.setPitch(pitch: number, groupName?: string): void
AudioManager.setMuted(muted: boolean, groupName?: string): void
```
Without groupName: sets global setting for all sounds. With groupName: sets setting for specific group.

## AudioItem Class

### Properties
```typescript
item.status: AudioStatus           // read-only
item.hold: boolean                 // get/set, controls hold mode playback
item.group: string | undefined
item.mode: PlayMode
item.volume: number                // 0 to 1
item.pan: number                   // -1 to 1
item.pitch: number                 // playback rate
item.loop: boolean
item.onStart: (() => void) | undefined
item.onFinish: (() => void) | undefined
item.onRepeat: (() => void) | undefined
```

### Methods
```typescript
item.play(): void
item.pause(): void
item.resume(): void
item.stop(): void
item.reset(): void
item.fadeIn(duration: number): void   // duration in seconds
item.fadeOut(duration: number): void  // duration in seconds
item.updateProperties(): void         // call after changing volume/pan/pitch
```

### Note on Properties
After modifying volume, pan, or pitch on an AudioItem instance, call `updateProperties()` to apply changes.

## Content Loaders

### AudioBufferLoader
```typescript
AudioBufferLoader(url: string): Promise<AudioBuffer>
```
Loads audio file as AudioBuffer via fetch/Web Audio API. Requires web server (http/https), not file://.

### AudioElementLoader
```typescript
AudioElementLoader(url: string): Promise<HTMLAudioElement>
```
Loads audio file as HTMLAudioElement. Works with both web server and file:// protocol.

### Usage with @basementuniverse/content-manager
```typescript
import ContentManager from '@basementuniverse/content-manager';
import { AudioBufferLoader } from '@basementuniverse/audio-manager';

ContentManager.initialise({
  loaders: {
    'audio-buffer': AudioBufferLoader,
  },
});

ContentManager.load([
  { name: 'my-audio', type: 'audio-buffer', args: ['./sound.mp3'] }
]);

// Returns AudioBuffer instance
const buffer = ContentManager.get('my-audio');
```

## Usage Patterns

### Basic Setup
```typescript
AudioManager.initialise({
  bgMusic: {
    audio: new Audio('music.mp3'),
    mode: PlayMode.Trigger,
    volume: 0.5,
    loop: true,
  },
  explosion: {
    audio: audioBuffer,  // AudioBuffer instance
    mode: PlayMode.Retrigger,
    volume: 0.8,
    group: 'effects',
  },
});
```

### Direct Control
```typescript
AudioManager.play('bgMusic');
AudioManager.stop('explosion');
AudioManager.fadeOut('bgMusic', 2);
```

### Instance Control
```typescript
const sound = AudioManager.sounds['bgMusic'];
sound.volume = 0.3;
sound.pitch = 1.2;
sound.updateProperties();
sound.play();
```

### Hold Mode
```typescript
const item = AudioManager.sounds['engine'];
item.hold = true;   // starts playing (if mode is 'hold')
item.hold = false;  // stops playing
```

### Group Control
```typescript
AudioManager.setVolume(0.5, 'effects');  // set volume for effects group
AudioManager.stopAll('music');           // stop all music group sounds
```

## Key Behaviors

- AudioBuffer sources create new BufferSourceNode each play (Web Audio API requirement)
- HTMLAudioElement sources reuse MediaElementAudioSourceNode
- Pause on AudioBuffer sources effectively stops them (no resume position tracking)
- Global settings multiply with individual sound settings
- Group settings apply to all sounds with matching group property
- Hold mode requires manually setting item.hold property to true/false
- Trigger mode ignores play() calls while already playing
- Retrigger mode restarts sound from beginning if already playing
