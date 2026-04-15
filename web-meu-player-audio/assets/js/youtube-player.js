function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve, reject) => {
    const existingHandler = window.onYouTubeIframeAPIReady;
    const timeoutId = window.setTimeout(() => {
      reject(new Error("YouTube API indisponivel."));
    }, 10000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeoutId);

      if (typeof existingHandler === "function") {
        existingHandler();
      }

      resolve(window.YT);
    };
  });
}

export class YouTubePlayer {
  constructor(containerId) {
    this.containerId = containerId;
    this.player = null;
    this.readyPromise = null;
    this.progressTimer = null;
    this.onProgress = () => {};
    this.onEnded = () => {};
    this.onPlaybackChange = () => {};
    this.volume = 85;
  }

  async init(initialVideoId = "") {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise(async (resolve, reject) => {
      try {
        const YT = await loadYouTubeApi();

        this.player = new YT.Player(this.containerId, {
          height: "1",
          width: "1",
          videoId: initialVideoId,
          playerVars: {
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => resolve(),
            onStateChange: (event) => this.handleStateChange(event),
          },
        });
      } catch (error) {
        reject(error);
      }
    });

    return this.readyPromise;
  }

  async load(track, autoplay = false) {
    await this.init(track.youtubeId);

    if (autoplay) {
      this.player.loadVideoById(track.youtubeId);
    } else {
      this.player.cueVideoById(track.youtubeId);
    }

    await this.waitForVideoReady();
    this.player.setVolume(this.volume);
    this.emitProgress();
  }

  async play() {
    await this.init();
    this.player.playVideo();
  }

  pause() {
    if (!this.player) {
      return;
    }

    this.player.pauseVideo();
    this.stopProgressTimer();
  }

  stop() {
    if (!this.player) {
      return;
    }

    this.player.stopVideo();
    this.stopProgressTimer();
  }

  seekTo(seconds) {
    if (!this.player) {
      return;
    }

    this.player.seekTo(seconds, true);
    this.emitProgress();
  }

  setVolume(volume) {
    this.volume = volume;

    if (this.player) {
      this.player.setVolume(volume);
    }
  }

  getCurrentTime() {
    if (!this.player?.getCurrentTime) {
      return 0;
    }

    return this.player.getCurrentTime() || 0;
  }

  getDuration() {
    if (!this.player?.getDuration) {
      return 0;
    }

    return this.player.getDuration() || 0;
  }

  emitProgress() {
    this.onProgress({
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
    });
  }

  handleStateChange(event) {
    if (!window.YT?.PlayerState) {
      return;
    }

    const states = window.YT.PlayerState;

    if (event.data === states.PLAYING) {
      this.startProgressTimer();
      this.onPlaybackChange(true);
      this.emitProgress();
      return;
    }

    if (event.data === states.ENDED) {
      this.stopProgressTimer();
      this.onPlaybackChange(false);
      this.emitProgress();
      this.onEnded();
      return;
    }

    if (event.data === states.PAUSED || event.data === states.CUED) {
      this.stopProgressTimer();
      this.onPlaybackChange(false);
      this.emitProgress();
    }
  }

  startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = window.setInterval(() => {
      this.emitProgress();
    }, 250);
  }

  stopProgressTimer() {
    if (this.progressTimer) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  waitForVideoReady() {
    return new Promise((resolve) => {
      let attempts = 0;

      const intervalId = window.setInterval(() => {
        attempts += 1;

        const hasDuration = this.getDuration() > 0;
        const loadedVideoId = this.player?.getVideoData?.().video_id;

        if (hasDuration || loadedVideoId) {
          window.clearInterval(intervalId);
          resolve();
          return;
        }

        if (attempts >= 40) {
          window.clearInterval(intervalId);
          resolve();
        }
      }, 250);
    });
  }
}
