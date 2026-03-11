// Simple sound utility with preloading
class SoundPlayer {
  constructor() {
    this.audio = null;
    this.isEnabled = true;
  }

  // Preload the sound (optional - loads when component mounts)
  preload(soundUrl) {
    if (!this.audio && soundUrl) {
      this.audio = new Audio(soundUrl);
      this.audio.preload = 'auto';
      this.audio.volume = 0.5; // 50% volume
    }
  }

  // Play the sound
  play(soundUrl) {
    if (!this.isEnabled) return;
    
    try {
      // Create new audio instance each time to avoid "interrupted" state
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(e => {
        // Browser autoplay restrictions - silent fail
        console.log('Audio playback blocked:', e);
      });
    } catch (error) {
      console.log('Audio error:', error);
    }
  }

  // Toggle sound on/off
  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }
}

export default new SoundPlayer();