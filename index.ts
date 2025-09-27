// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type AudioOptions = {
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

export enum PlayMode {
  Trigger = 'trigger',
  Retrigger = 'retrigger',
  Hold = 'hold',
}

export enum AudioStatus {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
}

type GroupSettings = {
  volume: number;
  pan: number;
  pitch: number;
  muted: boolean;
};

// -----------------------------------------------------------------------------
// CLASSES
// -----------------------------------------------------------------------------

export class AudioItem {
  private static readonly DEFAULT_OPTIONS = {
    mode: PlayMode.Trigger,
    volume: 1,
    pan: 0,
    pitch: 1,
    loop: false,
  } as const;

  private audioContext: AudioContext;
  private audioBuffer?: AudioBuffer;
  private audioElement?: HTMLAudioElement;
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private source?: AudioBufferSourceNode | MediaElementAudioSourceNode;
  private mediaElementSource?: MediaElementAudioSourceNode;
  private isSourceConnected = false;
  private fadeTimeout?: number;
  private _hold = false;
  private _status = AudioStatus.Stopped;

  public group?: string;
  public mode: PlayMode = AudioItem.DEFAULT_OPTIONS.mode;
  public volume: number = AudioItem.DEFAULT_OPTIONS.volume;
  public pan: number = AudioItem.DEFAULT_OPTIONS.pan;
  public pitch: number = AudioItem.DEFAULT_OPTIONS.pitch;
  public loop: boolean = AudioItem.DEFAULT_OPTIONS.loop;

  public onStart?: () => void;
  public onFinish?: () => void;
  public onRepeat?: () => void;

  public constructor(
    audioContext: AudioContext,
    options: Partial<AudioOptions> & Required<Pick<AudioOptions, 'audio'>>
  ) {
    const actualOptions = Object.assign({}, AudioItem.DEFAULT_OPTIONS, options);
    this.audioContext = audioContext;

    this.group = actualOptions.group;
    this.mode = actualOptions.mode;
    this.volume = actualOptions.volume;
    this.pan = actualOptions.pan;
    this.pitch = actualOptions.pitch;
    this.loop = actualOptions.loop;

    this.onStart = actualOptions.onStart;
    this.onFinish = actualOptions.onFinish;
    this.onRepeat = actualOptions.onRepeat;

    // Create audio nodes
    this.gainNode = audioContext.createGain();
    this.panNode = audioContext.createStereoPanner();

    // Connect nodes
    this.gainNode.connect(this.panNode);
    this.panNode.connect(audioContext.destination);

    // Set up audio source
    if (actualOptions.audio instanceof AudioBuffer) {
      this.audioBuffer = actualOptions.audio;
    } else {
      this.audioElement = actualOptions.audio;
      // Create the MediaElementAudioSourceNode once for HTMLAudioElement
      if (this.audioElement.src) {
        this.mediaElementSource = this.audioContext.createMediaElementSource(
          this.audioElement
        );
      }
    }

    this.updateAudioProperties();
  }

  private updateAudioProperties(): void {
    this.gainNode.gain.value = this.volume;
    this.panNode.pan.value = this.pan;

    // Apply pitch based on pitch mode
    this.applyPitch();
  }

  private applyPitch(): void {
    if (this.source instanceof AudioBufferSourceNode) {
      this.source.playbackRate.value = this.pitch;
    } else if (this.audioElement) {
      this.audioElement.playbackRate = this.pitch;
    }
  }

  private createSource(): void {
    if (this.source && this.isSourceConnected) {
      this.disconnectSource();
    }

    if (this.audioBuffer) {
      // AudioBufferSourceNode can only be used once, so create a new one
      // each time
      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = this.audioBuffer;
      bufferSource.loop = this.loop;

      bufferSource.onended = () => {
        if (this.loop && this._status === AudioStatus.Playing) {
          this.onRepeat?.();
        } else {
          this._status = AudioStatus.Stopped;
          this.onFinish?.();
        }
      };

      this.source = bufferSource;
    } else if (this.audioElement) {
      if (!this.audioElement.src) {
        return;
      }

      // Reuse the existing MediaElementAudioSourceNode
      if (!this.mediaElementSource) {
        this.mediaElementSource = this.audioContext.createMediaElementSource(
          this.audioElement
        );
      }

      this.audioElement.loop = this.loop;

      // Set up the onended callback on the audio element
      this.audioElement.onended = () => {
        if (this.loop && this._status === AudioStatus.Playing) {
          this.onRepeat?.();
        } else {
          this._status = AudioStatus.Stopped;
          this.onFinish?.();
        }
      };

      this.source = this.mediaElementSource;
    }

    if (this.source) {
      this.source.connect(this.gainNode);
      this.isSourceConnected = true;

      // Apply pitch after source is connected
      this.applyPitch();
    }
  }

  private disconnectSource(): void {
    if (this.source && this.isSourceConnected) {
      this.source.disconnect();
      this.isSourceConnected = false;

      // For AudioBufferSourceNode, clear the reference since it can't be reused
      if (this.source instanceof AudioBufferSourceNode) {
        this.source = undefined;
      }
      // For MediaElementAudioSourceNode, keep the reference for reuse
    }
  }

  public get status(): AudioStatus {
    return this._status;
  }

  public get hold(): boolean {
    return this._hold;
  }

  public set hold(value: boolean) {
    this._hold = value;

    if (this.mode === 'hold') {
      if (value && this._status !== AudioStatus.Playing) {
        this.play();
      } else if (!value && this._status === AudioStatus.Playing) {
        this.stop();
      }
    }
  }

  public play(): void {
    if (this.mode === 'trigger' && this._status === AudioStatus.Playing) {
      return;
    }

    if (this.mode === 'retrigger' && this._status === AudioStatus.Playing) {
      this.stop();
    }

    if (this.mode === 'hold' && !this._hold) {
      return;
    }

    this.createSource();

    if (this.source instanceof AudioBufferSourceNode) {
      this.source.start();
    } else if (this.audioElement) {
      this.audioElement.currentTime = 0;
      this.audioElement.play();
    }

    this._status = AudioStatus.Playing;
    this.onStart?.();
  }

  public fadeIn(duration: number): void {
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }

    const originalVolume = this.volume;
    this.gainNode.gain.value = 0;
    this.play();

    const startTime = this.audioContext.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(
      originalVolume,
      startTime + duration
    );

    this.fadeTimeout = window.setTimeout(() => {
      this.gainNode.gain.value = originalVolume;
    }, duration * 1000);
  }

  public fadeOut(duration: number): void {
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }

    if (this._status !== AudioStatus.Playing) {
      return;
    }

    const startTime = this.audioContext.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    this.fadeTimeout = window.setTimeout(() => {
      this.stop();
      this.gainNode.gain.value = this.volume;
    }, duration * 1000);
  }

  public stop(): void {
    if (this._status === AudioStatus.Stopped) {
      return;
    }

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = undefined;
    }

    if (this.source instanceof AudioBufferSourceNode) {
      this.source.stop();
    } else if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    this._status = AudioStatus.Stopped;
    this.disconnectSource();
  }

  public pause(): void {
    if (this._status !== AudioStatus.Playing) {
      return;
    }

    if (this.audioElement) {
      this.audioElement.pause();
    } else {
      // For AudioBuffer sources, we need to stop and remember position
      this.stop();
    }

    this._status = AudioStatus.Paused;
  }

  public resume(): void {
    if (this._status !== AudioStatus.Paused) {
      return;
    }

    if (this.audioElement) {
      this.audioElement.play();
      this._status = AudioStatus.Playing;
    } else {
      // For AudioBuffer sources, we need to restart from beginning
      this.play();
    }

    this._status = AudioStatus.Playing;
  }

  public reset(): void {
    this.stop();

    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
  }

  public updateProperties(): void {
    this.updateAudioProperties();
  }
}

export class AudioManager {
  private static readonly DEFAULT_GROUP_SETTINGS: GroupSettings = {
    volume: 1,
    pan: 0,
    pitch: 1,
    muted: false,
  };

  private static instance: AudioManager;

  private audioContext: AudioContext;
  private sounds: Map<string, AudioItem> = new Map();

  private _globalVolume = 1;
  private _globalPan = 0;
  private _globalPitch = 1;
  private _globalMuted = false;

  private groupSettings: Map<string, GroupSettings> = new Map();

  private constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }

  public get globalVolume(): number {
    return this._globalVolume;
  }

  public get globalPan(): number {
    return this._globalPan;
  }

  public get globalPitch(): number {
    return this._globalPitch;
  }

  public get globalMuted(): boolean {
    return this._globalMuted;
  }

  private static getDefaultGroupSettings(): GroupSettings {
    return {
      ...AudioManager.DEFAULT_GROUP_SETTINGS,
    };
  }

  public static initialise(soundsConfig: Record<string, AudioOptions>): void {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }

    for (const [name, options] of Object.entries(soundsConfig)) {
      AudioManager.add(name, options);
    }
  }

  public static get sounds(): Record<string, AudioItem> {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    const sounds: Record<string, AudioItem> = {};
    AudioManager.instance.sounds.forEach((sound, name) => {
      sounds[name] = sound;
    });
    return sounds;
  }

  public static add(name: string, options: AudioOptions): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    const sound = new AudioItem(AudioManager.instance.audioContext, options);
    AudioManager.instance.sounds.set(name, sound);
  }

  public static remove(name: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    const sound = AudioManager.instance.sounds.get(name);
    if (sound) {
      sound.stop();
      AudioManager.instance.sounds.delete(name);
    }
  }

  static setVolume(volume: number, groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    if (groupName) {
      const settings =
        AudioManager.instance.groupSettings.get(groupName) ||
        AudioManager.getDefaultGroupSettings();
      settings.volume = volume;
      AudioManager.instance.groupSettings.set(groupName, settings);

      AudioManager.instance.sounds.forEach(sound => {
        if (sound.group === groupName) {
          sound.volume = volume;
          sound.updateProperties();
        }
      });
    } else {
      AudioManager.instance._globalVolume = volume;
      AudioManager.instance.sounds.forEach(sound => {
        if (!sound.group) {
          sound.volume = volume;
          sound.updateProperties();
        }
      });
    }
  }

  public static setPan(pan: number, groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    if (groupName) {
      const settings =
        AudioManager.instance.groupSettings.get(groupName) ||
        AudioManager.getDefaultGroupSettings();
      settings.pan = pan;
      AudioManager.instance.groupSettings.set(groupName, settings);

      AudioManager.instance.sounds.forEach(sound => {
        if (sound.group === groupName) {
          sound.pan = pan;
          sound.updateProperties();
        }
      });
    } else {
      AudioManager.instance._globalPan = pan;
      AudioManager.instance.sounds.forEach(sound => {
        if (!sound.group) {
          sound.pan = pan;
          sound.updateProperties();
        }
      });
    }
  }

  public static setPitch(pitch: number, groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    if (groupName) {
      const settings =
        AudioManager.instance.groupSettings.get(groupName) ||
        AudioManager.getDefaultGroupSettings();
      settings.pitch = pitch;
      AudioManager.instance.groupSettings.set(groupName, settings);

      AudioManager.instance.sounds.forEach(sound => {
        if (sound.group === groupName) {
          sound.pitch = pitch;
          sound.updateProperties();
        }
      });
    } else {
      AudioManager.instance._globalPitch = pitch;
      AudioManager.instance.sounds.forEach(sound => {
        if (!sound.group) {
          sound.pitch = pitch;
          sound.updateProperties();
        }
      });
    }
  }

  public static setMuted(muted: boolean, groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    if (groupName) {
      const settings =
        AudioManager.instance.groupSettings.get(groupName) ||
        AudioManager.getDefaultGroupSettings();
      settings.muted = muted;
      AudioManager.instance.groupSettings.set(groupName, settings);

      AudioManager.instance.sounds.forEach(sound => {
        if (sound.group === groupName) {
          // Implement muting by setting gain to 0
          const gainNode = (sound as any).gainNode as GainNode;
          gainNode.gain.value = muted ? 0 : sound.volume;
        }
      });
    } else {
      AudioManager.instance._globalMuted = muted;
      AudioManager.instance.sounds.forEach(sound => {
        if (!sound.group) {
          const gainNode = (sound as any).gainNode as GainNode;
          gainNode.gain.value = muted ? 0 : sound.volume;
        }
      });
    }
  }

  public static playAll(groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    AudioManager.instance.sounds.forEach(sound => {
      if (!groupName || sound.group === groupName) {
        sound.play();
      }
    });
  }

  public static pauseAll(groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    AudioManager.instance.sounds.forEach(sound => {
      if (!groupName || sound.group === groupName) {
        sound.pause();
      }
    });
  }

  public static resumeAll(groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    AudioManager.instance.sounds.forEach(sound => {
      if (
        (!groupName || sound.group === groupName) &&
        sound.status === AudioStatus.Paused
      ) {
        sound.resume();
      }
    });
  }

  public static stopAll(groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    AudioManager.instance.sounds.forEach(sound => {
      if (!groupName || sound.group === groupName) {
        sound.stop();
      }
    });
  }

  public static resetAll(groupName?: string): void {
    if (!AudioManager.instance) {
      throw new Error('AudioManager not initialised');
    }

    AudioManager.instance.sounds.forEach(sound => {
      if (!groupName || sound.group === groupName) {
        sound.reset();
      }
    });
  }

  // Static convenience methods for individual sounds
  public static play(name: string): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.play();
    }
  }

  public static fadeIn(name: string, duration: number): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.fadeIn(duration);
    }
  }

  public static fadeOut(name: string, duration: number): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.fadeOut(duration);
    }
  }

  public static stop(name: string): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.stop();
    }
  }

  public static pause(name: string): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.pause();
    }
  }

  public static resume(name: string): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.resume();
    }
  }

  public static reset(name: string): void {
    const sound = AudioManager.sounds[name];
    if (sound) {
      sound.reset();
    }
  }
}

// -----------------------------------------------------------------------------
// CONTENT LOADER
// -----------------------------------------------------------------------------

/**
 * Content Manager Loader for loading an audio file as an AudioBuffer
 *
 * @see https://www.npmjs.com/package/@basementuniverse/content-manager
 */
export const AudioBufferLoader = async (url: string): Promise<AudioBuffer> => {
  return new Promise<AudioBuffer>(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      resolve(audioBuffer);
    } catch (error) {
      reject(`Error loading audio buffer "${url}": ${error}`);
    }
  });
};
