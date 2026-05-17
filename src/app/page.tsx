"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, RefreshCw, Info, CheckCircle2, Music, Shuffle, Anchor } from "lucide-react";
import { audioEngineInstance, PitchData, NOTE_STRINGS } from "@/lib/audioEngine";
import { musicAIInstance, Scale } from "@/lib/musicAI";

interface CadenceOption {
  title: string;
  chords: string[];
}

interface KeyProgression {
  standard: string[];
  inverted: string[];
  cadences: CadenceOption[];
}

// Banco de dados musical das progressões de adoração modernas em CIFRA PURA
const WORSHIP_PROGRESSIONS: { [key: string]: KeyProgression } = {
  // Tons Maiores
  "C": {
    standard: ["C2", "G2", "Am7", "F"],
    inverted: ["F", "G2", "Am7", "Em7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["Dm7", "G7", "C2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["F", "Fm", "C2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["Ab", "Bb", "C2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["F/G", "G7", "C2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["Bb", "F", "C2"] }
    ]
  },
  "C#": {
    standard: ["C#2", "G#2", "A#m7", "F#"],
    inverted: ["F#", "G#2", "A#m7", "Fm7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão)", chords: ["D#m7", "G#7", "C#2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor)", chords: ["F#", "F#m", "C#2"] },
      { title: "bVI ➔ bVII ➔ I (Épica)", chords: ["A", "B", "C#2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel)", chords: ["F#/G#", "G#7", "C#2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor)", chords: ["B", "F#", "C#2"] }
    ]
  },
  "D": {
    standard: ["D2", "A2", "Bm7", "G"],
    inverted: ["G", "A2", "Bm7", "F#m7"], // BATE 100% COM OS SEUS DOIS PRINTS!
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["Em7", "A7", "D2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["G", "Gm", "D2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["Bb", "C", "D2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["G/A", "A7", "D2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["C", "G", "D2"] }
    ]
  },
  "D#": {
    standard: ["D#2", "A#2", "Cm7", "G#"],
    inverted: ["G#", "A#2", "Cm7", "Gm7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão)", chords: ["Fm7", "A#7", "D#2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor)", chords: ["G#", "G#m", "D#2"] },
      { title: "bVI ➔ bVII ➔ I (Épica)", chords: ["B", "C#", "D#2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel)", chords: ["G#/A#", "A#7", "D#2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor)", chords: ["C#", "G#", "D#2"] }
    ]
  },
  "E": {
    standard: ["E2", "B2", "C#m7", "A"],
    inverted: ["A", "B2", "C#m7", "G#m7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["F#m7", "B7", "E2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["A", "Am", "E2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["C", "D", "E2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["A/B", "B7", "E2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["D", "A", "E2"] }
    ]
  },
  "F": {
    standard: ["F2", "C2", "Dm7", "Bb"],
    inverted: ["Bb", "C2", "Dm7", "Am7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["Gm7", "C7", "F2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["Bb", "Bbm", "F2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["Db", "Eb", "F2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["Bb/C", "C7", "F2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["Eb", "Bb", "F2"] }
    ]
  },
  "F#": {
    standard: ["F#2", "C#2", "D#m7", "B"],
    inverted: ["B", "C#2", "D#m7", "A#m7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão)", chords: ["G#m7", "C#7", "F#2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor)", chords: ["B", "Bm", "F#2"] },
      { title: "bVI ➔ bVII ➔ I (Épica)", chords: ["D", "E", "F#2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel)", chords: ["B/C#", "C#7", "F#2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor)", chords: ["E", "B", "F#2"] }
    ]
  },
  "G": {
    standard: ["G2", "D2", "Em7", "C"],
    inverted: ["C", "D2", "Em7", "Bm7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["Am7", "D7", "G2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["C", "Cm", "G2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["Eb", "F", "G2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["C/D", "D7", "G2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["F", "C", "G2"] }
    ]
  },
  "G#": {
    standard: ["G#2", "D#2", "Fm7", "C#"],
    inverted: ["C#", "D#2", "Fm7", "Cm7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão)", chords: ["A#m7", "D#7", "G#2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor)", chords: ["C#", "C#m", "G#2"] },
      { title: "bVI ➔ bVII ➔ I (Épica)", chords: ["E", "F#", "G#2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel)", chords: ["C#/D#", "D#7", "G#2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor)", chords: ["F#", "C#", "G#2"] }
    ]
  },
  "A": {
    standard: ["A2", "E2", "F#m7", "D"],
    inverted: ["D", "E2", "F#m7", "C#m7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["Bm7", "E7", "A2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["D", "Dm", "A2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["F", "G", "A2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["D/E", "E7", "A2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["G", "D", "A2"] }
    ]
  },
  "A#": {
    standard: ["A#2", "F2", "Gm7", "D#"],
    inverted: ["D#", "F2", "Gm7", "Dm7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão)", chords: ["Cm7", "F7", "A#2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor)", chords: ["D#", "D#m", "A#2"] },
      { title: "bVI ➔ bVII ➔ I (Épica)", chords: ["F#", "G#", "A#2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel)", chords: ["D#/F", "F7", "A#2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor)", chords: ["G#", "D#", "A#2"] }
    ]
  },
  "B": {
    standard: ["B2", "F#2", "G#m7", "E"],
    inverted: ["E", "F#2", "G#m7", "D#m7"],
    cadences: [
      { title: "ii ➔ V ➔ I (Padrão Jazz/Pop)", chords: ["C#m7", "F#7", "B2"] },
      { title: "IV ➔ iv ➔ I (Plagal Menor Emocional)", chords: ["E", "Em", "B2"] },
      { title: "bVI ➔ bVII ➔ I (Épica / Lady Gaga)", chords: ["G", "A", "B2"] },
      { title: "IV/V ➔ V7 ➔ I (Gospel / Soul)", chords: ["E/F#", "F#7", "B2"] },
      { title: "bVII ➔ IV ➔ I (Backdoor / Rock)", chords: ["A", "E", "B2"] }
    ]
  },

  // Tons Menores
  "Cm": {
    standard: ["Cm7", "Eb2", "Bb2", "Ab"],
    inverted: ["Ab", "Bb2", "Cm7", "Gm7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Ddim", "G7", "Cm7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Fm7", "G7", "Cm7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["Ab", "Bb", "Cm7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Fm7", "Cm7"] }
    ]
  },
  "C#m": {
    standard: ["C#m7", "E2", "B2", "A"],
    inverted: ["A", "B2", "C#m7", "G#m7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["D#dim", "G#7", "C#m7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["F#m7", "G#7", "C#m7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["A", "B", "C#m7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["F#m7", "C#m7"] }
    ]
  },
  "Dm": {
    standard: ["Dm7", "F2", "C2", "Bb"],
    inverted: ["Bb", "C2", "Dm7", "Am7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Edim", "A7", "Dm7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Gm7", "A7", "Dm7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["Bb", "C", "Dm7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Gm7", "Dm7"] }
    ]
  },
  "D#m": {
    standard: ["D#m7", "F#2", "C#2", "B"],
    inverted: ["B", "C#2", "D#m7", "A#m7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["E#dim", "A#7", "D#m7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["G#m7", "A#7", "D#m7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["B", "C#", "D#m7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["G#m7", "D#m7"] }
    ]
  },
  "Em": {
    standard: ["Em7", "G2", "D2", "C"],
    inverted: ["C", "D2", "Em7", "Bm7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["F#dim", "B7", "Em7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Am7", "B7", "Em7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["C", "D", "Em7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Am7", "Em7"] }
    ]
  },
  "Fm": {
    standard: ["Fm7", "Ab2", "Eb2", "Db"],
    inverted: ["Db", "Eb2", "Fm7", "Cm7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Gdim", "C7", "Fm7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Bbm7", "C7", "Fm7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["Db", "Eb", "Fm7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Bbm7", "Fm7"] }
    ]
  },
  "F#m": {
    standard: ["F#m7", "A2", "E2", "D"],
    inverted: ["D", "E2", "F#m7", "C#m7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["G#dim", "C#7", "F#m7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Bm7", "C#7", "F#m7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["D", "E", "F#m7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Bm7", "F#m7"] }
    ]
  },
  "Gm": {
    standard: ["Gm7", "Bb2", "F2", "Eb"],
    inverted: ["Eb", "F2", "Gm7", "Dm7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Adim", "D7", "Gm7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Cm7", "D7", "Gm7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["Eb", "F", "Gm7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Cm7", "Gm7"] }
    ]
  },
  "G#m": {
    standard: ["G#m7", "B2", "F#2", "E"],
    inverted: ["E", "F#2", "G#m7", "D#m7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["A#dim", "D#7", "G#m7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["C#m7", "D#7", "G#m7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["E", "F#", "G#m7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["C#m7", "G#m7"] }
    ]
  },
  "Am": {
    standard: ["Am7", "C2", "G2", "F"],
    inverted: ["F", "G2", "Am7", "Em7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Bdim", "E7", "Am7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Dm7", "E7", "Am7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["F", "G", "Am7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Dm7", "Am7"] }
    ]
  },
  "A#m": {
    standard: ["A#m7", "C#2", "G#2", "F#"],
    inverted: ["F#", "G#2", "A#m7", "E#m7"],
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["Bdim", "F7", "A#m7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["D#m7", "F7", "A#m7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["F#", "G#", "A#m7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["D#m7", "A#m7"] }
    ]
  },
  "Bm": {
    standard: ["Bm7", "D2", "A2", "G"],
    inverted: ["G", "A2", "Bm7", "F#m7"], // BATE COM O DOIS EXATAMENTE!
    cadences: [
      { title: "ii° ➔ V7 ➔ i (Clássica / Jazz)", chords: ["C#dim", "F#7", "Bm7"] },
      { title: "iv ➔ V7 ➔ i (Menor Emocional)", chords: ["Em7", "F#7", "Bm7"] },
      { title: "bVI ➔ bVII ➔ i (Épica Menor)", chords: ["G", "A", "Bm7"] },
      { title: "iv ➔ i (Plagal Menor)", chords: ["Em7", "Bm7"] }
    ]
  }
};

export default function Home() {
  const [step, setStep] = useState<"welcome" | "listening" | "result">("welcome");
  
  // Áudio e captação
  const [isListening, setIsListening] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  
  // Progresso de captação
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notas capturadas na frase
  const [capturedNotesList, setCapturedNotesList] = useState<number[]>([]);
  const [estimatedScale, setEstimatedScale] = useState<Scale | null>(null);
  
  // Banco de Cifras
  const [currentProgression, setCurrentProgression] = useState<KeyProgression | null>(null);

  // Estabilização de Pitch e Visualização
  const rawNoteBufferRef = useRef<number[]>([]);
  const lastStableNoteRef = useRef<number>(-1);
  const loopRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawAnimationRef = useRef<number | null>(null);

  // Canvas visualizer rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 80;
    };
    resizeCanvas();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isListening || !analyser) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "#e4e4e7";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff6600"; // Warm Orange visualizer wave to match prints
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      drawAnimationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (drawAnimationRef.current) cancelAnimationFrame(drawAnimationRef.current);
    };
  }, [isListening, analyser, step]);

  // Cleanup effects on unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      audioEngineInstance.stopStream();
    };
  }, []);

  // Iniciar captação do microfone e gravar a frase
  const startRecordingPhrase = async () => {
    try {
      const node = await audioEngineInstance.startStream();
      setAnalyser(node);
      setIsListening(true);
      setStep("listening");
      setProgress(0);
      
      musicAIInstance.resetHistory();
      rawNoteBufferRef.current = [];
      lastStableNoteRef.current = -1;
      const notesAccumulated: number[] = [];
      setCapturedNotesList([]);

      // Iniciar thread de escuta DSP
      startAnalysisThread(notesAccumulated);

      // Timer de captação de 6 segundos
      const duration = 6000;
      const interval = 100;
      let elapsed = 0;

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      progressIntervalRef.current = setInterval(() => {
        elapsed += interval;
        const pct = Math.min((elapsed / duration) * 100, 100);
        setProgress(pct);

        if (elapsed >= duration) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          
          audioEngineInstance.stopStream();
          if (loopRef.current) cancelAnimationFrame(loopRef.current);
          setAnalyser(null);
          setIsListening(false);
          setPitchData(null);

          // Executar análise teórica
          processTheoryResults(notesAccumulated);
        }
      }, interval);

    } catch (err) {
      console.error(err);
      alert("Permissão do microfone recusada.");
    }
  };

  // DSP thread acumulador de notas
  const startAnalysisThread = (accumulator: number[]) => {
    const analyze = () => {
      const data = audioEngineInstance.detectPitch(0.015);
      
      if (data && data.noteIndex >= 0) {
        setPitchData(data);
        
        rawNoteBufferRef.current.push(data.noteIndex);
        if (rawNoteBufferRef.current.length > 3) {
          rawNoteBufferRef.current.shift();
        }

        const allSame = rawNoteBufferRef.current.every(val => val === data.noteIndex);
        if (allSame && data.noteIndex !== lastStableNoteRef.current) {
          lastStableNoteRef.current = data.noteIndex;
          
          accumulator.push(data.noteIndex);
          musicAIInstance.addNoteToHistory(data.noteIndex);
        }
      }

      loopRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  // Processa os resultados de Teoria Musical e busca progressões e cadências corretas
  const processTheoryResults = (notesSang: number[]) => {
    // 1. Estimar o Tom diatônico
    const scale = musicAIInstance.estimateKey();
    setEstimatedScale(scale);

    // 2. Filtrar notas únicas cantadas
    const uniqueNotes = Array.from(new Set(notesSang)).sort((a, b) => a - b);
    setCapturedNotesList(uniqueNotes);

    // 3. Buscar no Banco de Cifras
    const noteName = scale.name.includes("Maior") ? scale.name.replace(" Maior", "") : scale.name.replace(" Menor", "");
    const lookupKey = scale.type === "minor" ? `${noteName}m` : noteName;
    const progression = WORSHIP_PROGRESSIONS[lookupKey] || WORSHIP_PROGRESSIONS["C"];
    
    setCurrentProgression(progression);

    // 4. Mudar para a tela de resultados
    setStep("result");
  };

  const resetAll = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    audioEngineInstance.stopStream();
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    setStep("welcome");
    setEstimatedScale(null);
    setCapturedNotesList([]);
    setCurrentProgression(null);
    setProgress(0);
  };

  // Retorna a cifra correspondente ao Tom para exibição
  const getScaleHeroCifra = (scale: Scale) => {
    const noteName = scale.name.includes("Maior") ? scale.name.replace(" Maior", "") : scale.name.replace(" Menor", "");
    return scale.type === "minor" ? `${noteName}m` : noteName;
  };

  return (
    <div className="phone-viewport py-8 px-4 flex flex-col gap-4">
      {/* BRAND HEADER */}
      <header className="flex flex-col items-center text-center gap-1.5 mb-2">
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-[var(--text-primary)]">
          Louvor IA
        </h1>
        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
          Dicionário de Cifras & Cadências de Ensaio
        </span>
      </header>

      {/* 1. TELA DE AGUARDANDO CAPTAÇÃO */}
      {step === "welcome" && (
        <div className="minimal-card flex flex-col gap-6 text-center animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Ouvir e Cifrar</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Cante ou toque uma melodia por 6 segundos. A IA vai identificar o tom, as notas cantadas e estruturar as **Cifras de Adoração**, incluindo as progressões invertidas da Ponte/Refrão e Cadências de Encerramento.
            </p>
          </div>

          <button
            onClick={startRecordingPhrase}
            className="btn-minimal btn-accent shadow-[0_4px_25px_rgba(255,102,0,0.15)] py-4 text-base bg-[#ff6600] hover:bg-[#e05900] text-white rounded-2xl flex items-center justify-center gap-2"
          >
            <Mic size={18} /> Ouvir Melodia de Ensaio
          </button>
        </div>
      )}

      {/* 2. ESCUTANDO E ACUMULANDO NOTAS */}
      {step === "listening" && (
        <div className="minimal-card flex flex-col gap-6 text-center animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#ff6600] uppercase tracking-wider">
              <span className="dot-indicator active bg-[#ff6600] shadow-[0_0_8px_#ff6600] animate-pulse" />
              Captando Frequências...
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Cante a Frase</h2>
          </div>

          {/* Minimal visualizer */}
          <div className="minimal-wave-container bg-orange-50 border-orange-100 border">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* Progress bar loader */}
          <div className="flex flex-col gap-2 text-left">
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              <span>Gravando para Cifrar</span>
              <span>{(6 - (progress * 6) / 100).toFixed(1)}s</span>
            </div>
            <div className="progress-container">
              <div className="progress-bar bg-[#ff6600]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={resetAll}
            className="btn-minimal btn-outline text-xs py-3 rounded-xl border border-zinc-200"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* 3. EXIBIR RESULTADOS: CIFRAS DO VERSO, PONTE E CADÊNCIAS */}
      {step === "result" && estimatedScale && currentProgression && (
        <div className="minimal-card flex flex-col gap-6 animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
          {/* Success Banner */}
          <div className="flex justify-between items-center border-b border-[var(--border-light)] pb-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Análise Completa</span>
              <span className="text-sm font-extrabold text-[#ff6600]">
                Cifras para o Ensaio
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Pronto
            </div>
          </div>

          {/* Tom Definido */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl py-4 px-4 text-center">
            <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Tom de Acompanhamento</span>
            <div className="text-3xl font-black text-orange-950 mt-1">
              {getScaleHeroCifra(estimatedScale)} ({estimatedScale.type === "minor" ? "Menor" : "Maior"})
            </div>
          </div>

          {/* Notas da Voz em Cifra Pura */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              Notas Cantadas (Melodia)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {capturedNotesList.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)] italic">Nenhuma nota identificada.</span>
              ) : (
                capturedNotesList.map((n, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800"
                  >
                    {NOTE_STRINGS[n]}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 1. VERSO E ESTROFE PRINCIPAL */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-1.5">
              <Music size={12} className="text-[#ff6600]" />
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                1. Progressão do Verso (Estrofe)
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              {currentProgression.standard.map((chord, idx) => (
                <div 
                  key={idx} 
                  className="bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-1 text-center shadow-sm flex flex-col items-center justify-center"
                >
                  <span className="text-lg font-black text-[#ff6600] tracking-tight leading-none">
                    {chord}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[9px] text-[var(--text-muted)] italic text-center">
              (Esta é a progressão principal e harmônica do louvor)
            </span>
          </div>

          {/* 2. REFRÃO E PONTE INVERTIDA */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-1.5">
              <Shuffle size={12} className="text-[#ff6600]" />
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                2. Inversão da Ponte (Refrão Invertido)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {currentProgression.inverted.map((chord, idx) => (
                <div 
                  key={idx} 
                  className="bg-orange-50/50 border border-orange-100 rounded-xl py-3 px-1 text-center shadow-sm flex flex-col items-center justify-center"
                >
                  <span className="text-lg font-black text-[#ff6600] tracking-tight leading-none">
                    {chord}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[9px] text-[var(--text-muted)] italic text-center">
              (Momentos da música onde a harmonia inverte)
            </span>
          </div>

          {/* 3. CADÊNCIAS DE ENCERRAMENTO (FINALIZAÇÕES) */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-1.5">
              <Anchor size={12} className="text-[#ff6600]" />
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                3. Cadências de Encerramento (Finalização)
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {currentProgression.cadences.map((cad, idx) => (
                <div 
                  key={idx} 
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm"
                >
                  <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide">
                    {cad.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {cad.chords.map((ch, chIdx) => (
                      <React.Fragment key={chIdx}>
                        <span className="font-extrabold text-[#ff6600] text-sm">
                          {ch}
                        </span>
                        {chIdx < cad.chords.length - 1 && (
                          <span className="text-zinc-400 text-xs font-semibold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset / Novo Teste */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={resetAll}
              className="btn-minimal btn-accent py-4 text-sm bg-[#ff6600] hover:bg-[#e05900] text-white rounded-2xl flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={14} /> Ouvir Outra Frase no Ensaio
            </button>
          </div>
        </div>
      )}

      {/* APP EXPLANATION FOOTER */}
      <footer className="flex gap-1.5 items-start p-3 bg-white border border-[var(--border-light)] rounded-xl text-[10px] text-[var(--text-secondary)] leading-relaxed">
        <Info size={12} className="text-[#ff6600] flex-shrink-0 mt-0.5" />
        <span>
          Visualizador de Cifras de Ensaio. Exibe as progressões padrão em cifra pura (`D2`, `Bm7`, etc.), as pontes invertidas onde a música muda, e as cadências ideais para finalizar os louvores no ensaio com sua banda.
        </span>
      </footer>
    </div>
  );
}
