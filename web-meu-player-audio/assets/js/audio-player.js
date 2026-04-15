export class AudioPlayer {
  constructor(audioElement) {
    this.audioElement = audioElement;
    this.onProgress = () => {};
    this.onEnded = () => {};
    this.onPlaybackChange = () => {};

    this.audioElement.addEventListener("timeupdate", () => {
      this.emitProgress();
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.emitProgress();
    });

    this.audioElement.addEventListener("ended", () => {
      this.onPlaybackChange(false);
      this.onEnded();
    });

    this.audioElement.addEventListener("play", () => {
      this.onPlaybackChange(true);
    });

    this.audioElement.addEventListener("pause", () => {
      this.onPlaybackChange(false);
    });
  }

  async load(track, autoplay = false) {
    this.audioElement.src = track.src;
    this.audioElement.load();

    await new Promise((resolve) => {
      const handleLoaded = () => {
        this.audioElement.removeEventListener("loadedmetadata", handleLoaded);
        resolve();
      };

      if (this.audioElement.readyState >= 1) {
        resolve();
        return;
      }

      this.audioElement.addEventListener("loadedmetadata", handleLoaded);
    });

    this.emitProgress();

    if (autoplay) {
      await this.play();
    }
  }

  async play() {
    await this.audioElement.play();
  }

  pause() {
    this.audioElement.pause();
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  seekTo(seconds) {
    this.audioElement.currentTime = seconds;
    this.emitProgress();
  }

  setVolume(volume) {
    this.audioElement.volume = volume;
  }

  getCurrentTime() {
    return this.audioElement.currentTime || 0;
  }

  getDuration() {
    return this.audioElement.duration || 0;
  }

  emitProgress() {
    this.onProgress({
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
    });
  }
}
