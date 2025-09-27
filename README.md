# Game Component: Audio Manager

A simple audio manager for games, built with the Web Audio API.

## Installation

```bash
npm install @basementuniverse/audio-manager
```

## How to use

We need to initialise the `AudioManager` with a list of audio items. Each item can contain an `HTMLAudioElement` or an `AudioBuffer` in the `audio` property.

```ts
import { AudioManager, AudioItem, PlayMode, AudioStatus } from '@basementuniverse/audio-manager';

AudioManager.initialise({
  // See "Audio Item Options" below for details
  mySound1: {
    audio: new Audio('path/to/mySound1.mp3'),
    volume: 0.5,
    loop: true,
  },
  mySound2: {
    audio: myAudioBuffer,
    volume: 0.8,
  },
  // etc...
});
```

## Audio Item Options

Each audio item should be of the following type:

```ts
type AudioOptions = {
  /**
   * An audio object to play, either an HTMLAudioElement or an AudioBuffer
   */
  audio: HTMLAudioElement | AudioBuffer;

  /**
   * Optional group name for grouping sounds
   */
  group?: string;

  /**
   * How to play the sound:
   *
   * - 'trigger' starts playing the sound when triggered and plays until
   *   finished. If we trigger it again while it's playing, it does nothing
   * - 'retrigger' starts playing the sound when triggered and restarts if
   *   triggered again while it's playing
   * - 'hold' starts playing the sound when held and stops when released
   *
   * Note: For 'hold' mode, you need to set the `hold` property on the sound
   * instance to start/stop playback.
   */
  mode: PlayMode;

  /**
   * Volume (0 to 1)
   */
  volume: number;

  /**
   * Pan (-1 to 1)
   */
  pan: number;

  /**
   * Pitch (playback rate), where 1 is normal pitch/speed
   * - In 'playback-rate' mode: affects both pitch and duration
   * - In 'pitch-shift' mode: attempts to affect only pitch (duration preserved)
   */
  pitch: number;

  /**
   * Whether to loop the sound when it reaches the end
   */
  loop: boolean;

  /**
   * Optional callback called when the sound starts playing
   */
  onStart?: () => void;

  /**
   * Optional callback called when the sound finishes playing (if not looping)
   */
  onFinish?: () => void;

  /**
   * Optional callback called each time the sound loops (if looping)
   */
  onRepeat?: () => void;
};
```

## Controlling Audio

The `AudioManager` provides various methods to control audio playback:

```ts
AudioManager.play('mySound1');
AudioManager.pause('mySound2');
AudioManager.stop('mySound1');
AudioManager.reset('mySound2');
AudioManager.fadeIn('mySound2', 1);
AudioManager.fadeOut('mySound1', 1);
```

We can also add and remove audio items dynamically:

```ts
AudioManager.add('mySound3', audioOptions);
AudioManager.remove('mySound2');
```

We can fetch a map of sounds or a specific sound:

```ts
AudioManager.sounds; // Record<string, AudioItem>
AudioManager.sounds['mySound1']; // AudioItem | undefined
```

We can control playback for all sounds or a specific group:

```ts
AudioManager.playAll(); // Play all sounds
AudioManager.playAll('music'); // Play all sounds in 'music' group

AudioManager.pauseAll(); // Pause all sounds
AudioManager.pauseAll('effects'); // Pause all sounds in 'effects' group

AudioManager.resumeAll(); // Resume all sounds
AudioManager.resumeAll('ambience'); // Resume all sounds in 'ambience' group

AudioManager.stopAll(); // Stop all sounds
AudioManager.stopAll('music'); // Stop all sounds in 'music' group

AudioManager.resetAll(); // Reset all sounds
AudioManager.resetAll('effects'); // Reset all sounds in 'effects' group
```

We can control settings for all sounds or a specific group:

```ts
AudioManager.setVolume(0.5); // Set volume for all sounds
AudioManager.setVolume(0.8, 'music'); // Set volume for 'music' group

AudioManager.setPitch(1.2); // Set pitch for all sounds
AudioManager.setPitch(0.9, 'effects'); // Set pitch for 'effects' group

AudioManager.setPan(0); // Set pan for all sounds
AudioManager.setPan(-0.5, 'ambience'); // Set pan for 'ambience' group

AudioManager.setMuted(true); // Mute all sounds
AudioManager.setMuted(false, 'music'); // Unmute 'music' group
```

To query the current global settings:

```ts
AudioManager.globalVolume; // number
AudioManager.globalPitch; // number
AudioManager.globalPan; // number
AudioManager.globalMuted; // boolean
```

If you have a reference to a specific sound, it can be controlled directly:

```ts
const sound = AudioManager.sounds['mySound1'];
if (sound) {
  sound.play();
  sound.stop();
  sound.pause();
  sound.resume();
  sound.reset();
  sound.fadeIn(1);
  sound.fadeOut(1);

  // Get/set the hold status (for 'hold' mode)
  sound.hold = true; // Start playing
  sound.hold = false; // Stop playing

  // Get the current status
  const status = sound.status; // AudioStatus

  // Change the volume, pan, and pitch
  sound.volume = 0.7;
  sound.pan = -0.3;
  sound.pitch = 1.1;

  // You will need to call `updateProperties` to apply changes to volume, pan, and pitch
  sound.updateProperties();
}
```

## Content Loader

If you're using the [`@basementuniverse/content-manager`](https://www.npmjs.com/package/@basementuniverse/content-manager) package, you can use the `AudioBufferLoader` to load audio files as `AudioBuffer` objects, ready to be used with the `AudioManager`.

```ts
import { AudioBufferLoader } from '@basementuniverse/audio-manager';
import ContentManager from '@basementuniverse/content-manager';

ContentManager.initialise({
  loaders: {
    'audio-buffer': AudioBufferLoader,
  },
});

ContentManager.load([
  {
    name: 'my-audio-buffer',
    type: 'audio-buffer',
    args: ['./test.mp3'],
  },
]);

// ContentManager.get('my-audio-buffer') returns an AudioBuffer instance
```
