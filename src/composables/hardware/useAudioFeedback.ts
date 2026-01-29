export type AudioFeedbackType = 'success' | 'error' | 'scan'

export function useAudioFeedback() {
  const playBeep = (type: AudioFeedbackType = 'success') => {
    const frequencies: Record<AudioFeedbackType, number[]> = {
      success: [800, 1000],
      error: [400, 300],
      scan: [1200],
    }
    
    try {
      const ctx = new AudioContext()
      const freqs = frequencies[type]
      
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.value = freq
        osc.type = 'sine'
        
        gain.gain.value = 0.1
        
        const startTime = ctx.currentTime + (i * 0.1)
        osc.start(startTime)
        osc.stop(startTime + 0.1)
      })
    } catch {
      // Audio not available
    }
  }
  
  return { playBeep }
}
