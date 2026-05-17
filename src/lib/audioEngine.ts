// Algoritmo de Autocorrelação para detecção de frequência em tempo real
export interface PitchData {
  frequency: number;
  noteName: string;
  noteIndex: number; // 0-11
  octave: number;
  cents: number; // desvio do tom (-50 a +50)
  rms: number; // energia do sinal
}

export const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private sampleRate = 44100;
  private bufferSize = 2048;
  private buffer: Float32Array = new Float32Array(0);

  constructor() {
    this.buffer = new Float32Array(this.bufferSize);
  }

  async startStream(onStateChange?: (state: AudioContextState) => void): Promise<AnalyserNode> {
    if (this.analyser) return this.analyser;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false
      }
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ latencyHint: "interactive" });
    this.sampleRate = this.audioContext.sampleRate;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.bufferSize;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);

    if (onStateChange) {
      this.audioContext.onstatechange = () => {
        if (this.audioContext) onStateChange(this.audioContext.state);
      };
    }

    return this.analyser;
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.source = null;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Realiza a detecção de pitch em tempo real no buffer de áudio atual
   * @param threshold Limiar de volume (RMS) para evitar detecção em silêncio. Padrão: 0.01
   */
  detectPitch(threshold = 0.015): PitchData | null {
    if (!this.analyser) return null;

    // Obter dados no domínio do tempo
    this.analyser.getFloatTimeDomainData(this.buffer as any);

    // Calcular RMS (Root Mean Square) - energia do sinal
    let rms = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.bufferSize);

    // Se o sinal for muito fraco, assumir silêncio
    if (rms < threshold) {
      return {
        frequency: 0,
        noteName: "-",
        noteIndex: -1,
        octave: -1,
        cents: 0,
        rms
      };
    }

    // Algoritmo de Autocorrelação
    let r1 = 0;
    let r2 = this.bufferSize - 1;
    
    // Encontrar os limites reais do sinal (cortar silêncio nas bordas)
    const thres = 0.2 * rms;
    for (let i = 0; i < this.bufferSize / 2; i++) {
      if (Math.abs(this.buffer[i]) < thres) {
        r1 = i;
      } else {
        break;
      }
    }
    for (let i = this.bufferSize - 1; i >= this.bufferSize / 2; i--) {
      if (Math.abs(this.buffer[i]) < thres) {
        r2 = i;
      } else {
        break;
      }
    }

    const signal = this.buffer.subarray(r1, r2);
    const len = signal.length;

    // Autocorrelação de sinal
    const c = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i; j++) {
        c[i] += signal[j] * signal[j + i];
      }
    }

    // Encontrar o primeiro pico (lag)
    let d = 0;
    while (d < len - 1 && c[d] > c[d + 1]) {
      d++;
    }

    let maxVal = -1;
    let maxPos = -1;
    for (let i = d; i < len - 1; i++) {
      if (c[i] > c[i - 1] && c[i] > c[i + 1]) {
        if (c[i] > maxVal) {
          maxVal = c[i];
          maxPos = i;
        }
      }
    }

    // Se encontrarmos um pico válido
    if (maxPos !== -1) {
      const frequency = this.sampleRate / maxPos;

      // Ignorar frequências fora do espectro vocal/instrumental normal
      if (frequency >= 40 && frequency <= 2000) {
        return this.frequencyToNote(frequency, rms);
      }
    }

    return {
      frequency: 0,
      noteName: "-",
      noteIndex: -1,
      octave: -1,
      cents: 0,
      rms
    };
  }

  /**
   * Converte uma frequência em Hertz para informações sobre a nota musical
   */
  private frequencyToNote(frequency: number, rms: number): PitchData {
    // Fórmulas matemáticas padrão:
    // midi = 12 * log2(freq / 440) + 69
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const roundedNote = Math.round(noteNum);
    const cents = Math.round((noteNum - roundedNote) * 100);

    const noteIndex = (roundedNote % 12 + 12) % 12;
    const octave = Math.floor(roundedNote / 12) - 1;
    const noteName = NOTE_STRINGS[noteIndex];

    return {
      frequency,
      noteName,
      noteIndex,
      octave,
      cents,
      rms
    };
  }
}

export const audioEngineInstance = new AudioEngine();
