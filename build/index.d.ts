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
export declare enum PlayMode {
    Trigger = "trigger",
    Retrigger = "retrigger",
    Hold = "hold"
}
export declare enum AudioStatus {
    Stopped = "stopped",
    Playing = "playing",
    Paused = "paused"
}
export declare class AudioItem {
    private static readonly DEFAULT_OPTIONS;
    private audioContext;
    private audioBuffer?;
    private audioElement?;
    private gainNode;
    private panNode;
    private source?;
    private mediaElementSource?;
    private isSourceConnected;
    private fadeTimeout?;
    private _hold;
    private _status;
    group?: string;
    mode: PlayMode;
    volume: number;
    pan: number;
    pitch: number;
    loop: boolean;
    onStart?: () => void;
    onFinish?: () => void;
    onRepeat?: () => void;
    constructor(audioContext: AudioContext, options: Partial<AudioOptions> & Required<Pick<AudioOptions, 'audio'>>);
    private updateAudioProperties;
    private applyPitch;
    private createSource;
    private disconnectSource;
    get status(): AudioStatus;
    get hold(): boolean;
    set hold(value: boolean);
    play(): void;
    fadeIn(duration: number): void;
    fadeOut(duration: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    reset(): void;
    updateProperties(): void;
}
export declare class AudioManager {
    private static readonly DEFAULT_GROUP_SETTINGS;
    private static instance;
    private audioContext;
    private sounds;
    private _globalVolume;
    private _globalPan;
    private _globalPitch;
    private _globalMuted;
    private groupSettings;
    private constructor();
    get globalVolume(): number;
    get globalPan(): number;
    get globalPitch(): number;
    get globalMuted(): boolean;
    private static getDefaultGroupSettings;
    static initialise(soundsConfig: Record<string, AudioOptions>): void;
    static get sounds(): Record<string, AudioItem>;
    static add(name: string, options: AudioOptions): void;
    static remove(name: string): void;
    static setVolume(volume: number, groupName?: string): void;
    static setPan(pan: number, groupName?: string): void;
    static setPitch(pitch: number, groupName?: string): void;
    static setMuted(muted: boolean, groupName?: string): void;
    static playAll(groupName?: string): void;
    static pauseAll(groupName?: string): void;
    static resumeAll(groupName?: string): void;
    static stopAll(groupName?: string): void;
    static resetAll(groupName?: string): void;
    static play(name: string): void;
    static fadeIn(name: string, duration: number): void;
    static fadeOut(name: string, duration: number): void;
    static stop(name: string): void;
    static pause(name: string): void;
    static resume(name: string): void;
    static reset(name: string): void;
}
/**
 * Content Manager Loader for loading an audio file as an AudioBuffer
 *
 * @see https://www.npmjs.com/package/@basementuniverse/content-manager
 */
export declare const AudioBufferLoader: (url: string) => Promise<AudioBuffer>;
