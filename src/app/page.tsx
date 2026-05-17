"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, RefreshCw, Info, CheckCircle2, Music, Shuffle, Anchor, Plus, Minus, Search, Bookmark, Trash2 } from "lucide-react";
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

// Escala cromática de cifras para transposição
const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Banco de dados musical das progressões de adoração modernas em CIFRA PURA
const WORSHIP_PROGRESSIONS: { [key: string]: KeyProgression } = {
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
    inverted: ["G", "A2", "Bm7", "F#m7"],
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

interface LocalSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  lyrics: string; // Formato: "[D2]Meu Jesus [A2]Eu Te entrego..."
  keywords: string[];
}

// Banco de dados interno de louvores integrados e offline-ready
const LOCAL_SONGS_DATABASE: LocalSong[] = [
  {
    id: "eu_nao_posso_ficar_de_pe",
    title: "Eu Não Posso Ficar de Pé",
    artist: "David M. Quinlan",
    originalKey: "G#m",
    keywords: ["não", "posso", "ficar", "pé", "diante", "tua", "glória", "templo", "sacrifício", "altar", "queimar", "caia", "fogo", "céus", "israel"],
    lyrics: `[G#m]Eu não posso [B]ficar de [F#]pé
Diante da Tua [G#m]Gló[B]ria[F#]
[G#m]Eu não posso [B]ficar de [F#]pé
Diante da Tua [G#m]Gló[B]ria[F#]

[Segunda Parte]
[G#m]Sou teu templo, teu sa[E]crifício
[B]O teu altar vem queimar [F#]em mim
[G#m]Sou teu templo, teu sa[E]crifício
[B]O teu altar vem queimar [F#]em mim

[Interlúdio]
[G#m] [B] [F#]
[G#m] [B] [F#]

[Refrão]
[E]Caia fogo dos [B]céus
          [G#m]Queime esse altar
Mostra pra esse povo
[F#]Que há Deus em Israel`
  },
  {
    id: "eu_e_minha_casa",
    title: "Eu e Minha Casa",
    artist: "Worship / Ministério de Louvor",
    originalKey: "D",
    keywords: ["jesus", "entrego", "vida", "lar", "familia", "casa", "serviremos", "amor", "firmada", "rocha"],
    lyrics: `[D2]Meu Jesus [A2]Eu Te entrego minha vida
[Bm7]Te dou meu lar, minha família
[G]Eu e minha casa, Senhor
Te serviremos com amor

[G]A rocha em quem minha [A2]casa está firmada
[Bm7]É Ele, [F#m7]é Ele
[G]O amor que alcançou a [A2]minha casa
[Bm7]É Ele, [F#m7]é Ele`
  },
  {
    id: "bondade_de_deus",
    title: "Bondade de Deus (Goodness of God)",
    artist: "Bethel Music / Isaías Saad",
    originalKey: "G",
    keywords: ["amo", "deus", "graça", "falha", "dias", "mãos", "amanhecer", "deitar", "cantarei", "bondade"],
    lyrics: `[G]Te amo, Deus, Tua gra[C]ça nunca fa[G]lha
[D]Todos os dias [Em7]eu estou em Tuas [C]mãos
Desde o ama[Em7]nhecer até [C]eu me dei[G]tar
[D]Cantarei da bon[Em7]dade de [C]Deus`
  },
  {
    id: "a_casa_e_sua",
    title: "A Casa É Sua",
    artist: "Casa Worship",
    originalKey: "F",
    keywords: ["porque", "casa", "sua", "queremos", "ouvir", "então", "inundar", "encher", "lugar", "morar"],
    lyrics: `[F2]Porque a casa é [C2]Sua, nós queremos [Dm7]Te ouvir
A casa é [Bb]Sua, nós queremos Te ouvir
[F2]Então vem inun[C2]dar, encher esse lu[Dm7]gar
A casa é [Bb]Sua, vem morar aqui`
  },
  {
    id: "todavia_me_alegrarei",
    title: "Todavia Me Alegrarei",
    artist: "Samuel Messias",
    originalKey: "C",
    keywords: ["clamor", "dentro", "mim", "bom", "graça", "fim", "todavia", "alegrarei", "ti", "senhor"],
    lyrics: `[C2]Eu tenho um cla[G2]mor que está dentro de [Am7]mim
Que diz que Tu [F]és bom e a Tua graça não tem fim
[C2]Todavia me ale[G2]grarei, todavia me ale[Am7]grarei
Em Ti meu [F]Senhor`
  }
];

// Utilitário de transposição de acordes individuais
function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  
  let root = "";
  let rest = "";
  
  if (chord.length >= 2 && (chord[1] === "#" || chord[1] === "b")) {
    root = chord.slice(0, 2);
    rest = chord.slice(2);
  } else if (chord.length >= 1) {
    root = chord.slice(0, 1);
    rest = chord.slice(1);
  } else {
    return chord;
  }

  const enharmonics: { [key: string]: string } = {
    "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"
  };
  
  if (enharmonics[root]) {
    root = enharmonics[root];
  }

  const idx = CHROMATIC_SCALE.indexOf(root);
  if (idx === -1) return chord;

  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;

  return CHROMATIC_SCALE[newIdx] + rest;
}

interface LyricWordChunk {
  chord?: string;
  text: string;
}

export default function Home() {
  const [step, setStep] = useState<"welcome" | "listening" | "result">("welcome");
  
  // Áudio e captação
  const [isListening, setIsListening] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  
  // Transcrição de Voz
  const [transcription, setTranscription] = useState("");
  const recognitionRef = useRef<any>(null);

  // Progresso de captação
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notas capturadas na frase
  const [capturedNotesList, setCapturedNotesList] = useState<number[]>([]);
  const [estimatedScale, setEstimatedScale] = useState<Scale | null>(null);
  
  // Controle de Transposição da Cifra do Ensaio
  const [transposeSemitones, setTransposeSemitones] = useState(0);

  // Banco de Cifras
  const [currentProgression, setCurrentProgression] = useState<KeyProgression | null>(null);
  
  // Biblioteca Offline
  const [activeTab, setActiveTab] = useState<"ensaiar" | "biblioteca">("ensaiar");
  const [offlineSongs, setOfflineSongs] = useState<LocalSong[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Música carregada/identificada
  const [loadedSong, setLoadedSong] = useState<LocalSong | null>(null);

  // Estabilização de Pitch e Visualização
  const rawNoteBufferRef = useRef<number[]>([]);
  const lastStableNoteRef = useRef<number>(-1);
  const loopRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawAnimationRef = useRef<number | null>(null);

  // Carregar biblioteca offline do LocalStorage no início
  useEffect(() => {
    try {
      const saved = localStorage.getItem("louvor_ia_offline_library");
      if (saved) {
        setOfflineSongs(JSON.parse(saved));
      } else {
        localStorage.setItem("louvor_ia_offline_library", JSON.stringify(LOCAL_SONGS_DATABASE));
        setOfflineSongs(LOCAL_SONGS_DATABASE);
      }
    } catch (e) {
      console.error("Erro ao ler LocalStorage", e);
    }
  }, []);

  // Inicializar o Speech Recognition no mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "pt-BR";
        
        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscription(text);
        };

        rec.onerror = (e: any) => {
          console.warn("Speech Recognition Error / Timeout", e);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

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
        ctx.strokeStyle = "#ff6600";
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
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Iniciar captação do microfone e gravação de frase e fala
  const startRecordingPhrase = async () => {
    try {
      const node = await audioEngineInstance.startStream();
      setAnalyser(node);
      setIsListening(true);
      setStep("listening");
      setProgress(0);
      setTranscription("");
      setTransposeSemitones(0);
      setLoadedSong(null);
      
      musicAIInstance.resetHistory();
      rawNoteBufferRef.current = [];
      lastStableNoteRef.current = -1;
      const notesAccumulated: number[] = [];
      setCapturedNotesList([]);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech Recognition já estava ativo", e);
        }
      }

      startAnalysisThread(notesAccumulated);

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

          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
          }

          setTimeout(() => {
            processTheoryResults(notesAccumulated);
          }, 300);
        }
      }, interval);

    } catch (err) {
      console.error(err);
      alert("Permissão do microfone recusada.");
    }
  };

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

  const processTheoryResults = (notesSang: number[]) => {
    // 1. Estimar o Tom diatônico pela voz
    const scale = musicAIInstance.estimateKey();
    const noteName = scale.name.includes("Maior") ? scale.name.replace(" Maior", "") : scale.name.replace(" Menor", "");
    const lookupKey = scale.type === "minor" ? `${noteName}m` : noteName;

    // 2. Filtrar notas únicas cantadas
    const uniqueNotes = Array.from(new Set(notesSang)).sort((a, b) => a - b);
    setCapturedNotesList(uniqueNotes);

    // 3. Busca inteligente de louvor no banco de dados offline
    let matchedSong: LocalSong | null = null;
    const textToSearch = transcription.trim().toLowerCase();

    if (textToSearch.length > 2) {
      let highestScore = 0;
      
      offlineSongs.forEach(song => {
        let score = 0;
        song.keywords.forEach(kw => {
          if (textToSearch.includes(kw)) {
            score++;
          }
        });

        if (score > highestScore && score >= 2) {
          highestScore = score;
          matchedSong = song;
        }
      });
    }

    // 4. Carregar música correspondente ou criar improviso
    if (matchedSong) {
      setLoadedSong(matchedSong);
      
      // FORÇA O TOM ORIGINAL DA PRÓPRIA MÚSICA CADASTROU! (ex: G#m para Eu Não Posso Ficar de Pé)
      const originalKey = (matchedSong as LocalSong).originalKey;
      const originalNoteName = originalKey.endsWith("m") ? originalKey.slice(0, -1) : originalKey;
      const rootIndex = NOTE_STRINGS.indexOf(originalNoteName);
      const notesSet = new Set<number>([rootIndex === -1 ? 0 : rootIndex]);
      
      const songScale: Scale = {
        name: originalKey.endsWith("m") ? `${originalNoteName} Menor` : `${originalNoteName} Maior`,
        root: rootIndex === -1 ? 0 : rootIndex,
        type: originalKey.endsWith("m") ? "minor" : "major",
        notes: notesSet
      };

      setEstimatedScale(songScale);
      
      const progression = WORSHIP_PROGRESSIONS[originalKey] || WORSHIP_PROGRESSIONS["C"];
      setCurrentProgression(progression);
      setTransposeSemitones(0); // Inicia exatamente no Tom original correto da cifra do ensaio!
    } else {
      // Cria improviso baseado no tom estimado pela voz
      const progression = WORSHIP_PROGRESSIONS[lookupKey] || WORSHIP_PROGRESSIONS["C"];
      setCurrentProgression(progression);
      setEstimatedScale(scale);
      setTransposeSemitones(0);

      const fallbackText = transcription.trim() || "Minha melodia de adoração e oração no ensaio";
      const chords = progression.standard;
      const words = fallbackText.split(" ");
      let lyricWithBrackets = "";
      
      words.forEach((word, idx) => {
        if (idx < chords.length) {
          lyricWithBrackets += `[${chords[idx]}]${word} `;
        } else {
          lyricWithBrackets += `${word} `;
        }
      });

      const tempSong: LocalSong = {
        id: `improviso_${Date.now()}`,
        title: `Melodia Improvisada (${lookupKey})`,
        artist: "Espontâneo / Ensaio",
        originalKey: lookupKey,
        lyrics: lyricWithBrackets.trim(),
        keywords: words.map(w => w.toLowerCase())
      };
      
      setLoadedSong(tempSong);
    }

    setStep("result");
  };

  const saveSongToOfflineLibrary = () => {
    if (!loadedSong) return;

    const transposedLyrics = loadedSong.lyrics.split("\n").map(line => {
      const parts = parseCifraLine(line);
      return parts.map(part => {
        if (part.chord) {
          const trans = transposeChord(part.chord, transposeSemitones);
          return `[${trans}]${part.text}`;
        }
        return part.text;
      }).join("");
    }).join("\n");

    const newKey = transposeChord(loadedSong.originalKey, transposeSemitones);

    const songToSave: LocalSong = {
      ...loadedSong,
      id: loadedSong.id.startsWith("improviso_") ? loadedSong.id : `saved_${Date.now()}`,
      title: loadedSong.title.startsWith("Melodia Improvisada") ? loadedSong.title : `${loadedSong.title} (Transposto)`,
      originalKey: newKey,
      lyrics: transposedLyrics
    };

    const filtered = offlineSongs.filter(s => s.id !== loadedSong.id);
    const updated = [songToSave, ...filtered];
    
    setOfflineSongs(updated);
    localStorage.setItem("louvor_ia_offline_library", JSON.stringify(updated));
    
    alert("Música e cifra salvas com sucesso na sua biblioteca offline do ensaio!");
  };

  const deleteFromOfflineLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir este louvor da biblioteca offline?")) {
      const updated = offlineSongs.filter(s => s.id !== id);
      setOfflineSongs(updated);
      localStorage.setItem("louvor_ia_offline_library", JSON.stringify(updated));
    }
  };

  const loadOfflineSongDirectly = (song: LocalSong) => {
    setLoadedSong(song);
    setTransposeSemitones(0);
    
    const key = song.originalKey;
    const noteName = key.endsWith("m") ? key.slice(0, -1) : key;
    const progression = WORSHIP_PROGRESSIONS[key] || WORSHIP_PROGRESSIONS["C"];
    
    const rootIndex = NOTE_STRINGS.indexOf(noteName);
    const notesSet = new Set<number>([rootIndex === -1 ? 0 : rootIndex]);

    setEstimatedScale({
      name: key.endsWith("m") ? `${noteName} Menor` : `${noteName} Maior`,
      root: rootIndex === -1 ? 0 : rootIndex,
      type: key.endsWith("m") ? "minor" : "major",
      notes: notesSet
    });
    setCurrentProgression(progression);
    
    setStep("result");
    setActiveTab("ensaiar");
  };

  const resetAll = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    audioEngineInstance.stopStream();
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setStep("welcome");
    setEstimatedScale(null);
    setCapturedNotesList([]);
    setCurrentProgression(null);
    setProgress(0);
    setLoadedSong(null);
    setTransposeSemitones(0);
    setTranscription("");
  };

  const getScaleHeroCifra = (scale: Scale) => {
    const noteName = scale.name.includes("Maior") ? scale.name.replace(" Maior", "") : scale.name.replace(" Menor", "");
    return scale.type === "minor" ? `${noteName}m` : noteName;
  };

  const parseCifraLine = (line: string): LyricWordChunk[] => {
    const chunks: LyricWordChunk[] = [];
    let currentIdx = 0;
    
    while (currentIdx < line.length) {
      if (line[currentIdx] === "[") {
        const endBracketIdx = line.indexOf("]", currentIdx);
        if (endBracketIdx !== -1) {
          const chord = line.slice(currentIdx + 1, endBracketIdx);
          currentIdx = endBracketIdx + 1;
          
          const nextBracketIdx = line.indexOf("[", currentIdx);
          const text = nextBracketIdx !== -1 
            ? line.slice(currentIdx, nextBracketIdx) 
            : line.slice(currentIdx);
            
          chunks.push({ chord, text });
          currentIdx = nextBracketIdx !== -1 ? nextBracketIdx : line.length;
        } else {
          chunks.push({ text: line.slice(currentIdx) });
          break;
        }
      } else {
        const nextBracketIdx = line.indexOf("[", currentIdx);
        const text = nextBracketIdx !== -1 
          ? line.slice(currentIdx, nextBracketIdx) 
          : line.slice(currentIdx);
          
        chunks.push({ text });
        currentIdx = nextBracketIdx !== -1 ? nextBracketIdx : line.length;
      }
    }

    if (chunks.length === 0 && line.trim() !== "") {
      chunks.push({ text: line });
    }
    
    return chunks;
  };

  const renderTransposedCifra = (lyricsText: string) => {
    const lines = lyricsText.split("\n");
    return (
      <div className="flex flex-col gap-3 font-mono text-zinc-900 overflow-x-auto select-text leading-relaxed">
        {lines.map((line, lIdx) => {
          if (line.trim() === "") {
            return <div key={lIdx} className="h-2" />;
          }

          const chunks = parseCifraLine(line);
          return (
            <div key={lIdx} className="flex flex-wrap items-end min-h-[44px] py-1 border-b border-zinc-50">
              {chunks.map((chunk, cIdx) => (
                <div key={cIdx} className="flex flex-col relative pt-5 mr-1 min-w-[12px]">
                  {chunk.chord && (
                    <span className="absolute top-0 left-0 font-extrabold text-[#ff6600] text-xs md:text-sm tracking-wider select-none animate-[slideIn_0.2s_ease]">
                      {transposeChord(chunk.chord, transposeSemitones)}
                    </span>
                  )}
                  <span className="text-zinc-800 text-sm whitespace-pre">{chunk.text || " "}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const getTransposedCadences = (): CadenceOption[] => {
    if (!currentProgression) return [];
    return currentProgression.cadences.map(cad => ({
      title: cad.title,
      chords: cad.chords.map(ch => transposeChord(ch, transposeSemitones))
    }));
  };

  const getTransposedKeyHero = () => {
    if (!estimatedScale) return "";
    const noteName = estimatedScale.name.includes("Maior") ? estimatedScale.name.replace(" Maior", "") : estimatedScale.name.replace(" Menor", "");
    const lookupKey = estimatedScale.type === "minor" ? `${noteName}m` : noteName;
    return transposeChord(lookupKey, transposeSemitones);
  };

  const filteredOfflineSongs = offlineSongs.filter(song => {
    const query = searchQuery.toLowerCase();
    return song.title.toLowerCase().includes(query) || 
           song.artist.toLowerCase().includes(query) || 
           song.lyrics.toLowerCase().includes(query);
  });

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

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full max-w-xs mt-2 border border-zinc-200">
          <button
            onClick={() => setActiveTab("ensaiar")}
            className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "ensaiar" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            🎙️ Ensaiar / Captar
          </button>
          <button
            onClick={() => setActiveTab("biblioteca")}
            className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "biblioteca" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            📂 Biblioteca ({offlineSongs.length})
          </button>
        </div>
      </header>

      {/* ABA DA CAPTAÇÃO E RESULTADOS */}
      {activeTab === "ensaiar" && (
        <>
          {step === "welcome" && (
            <div className="minimal-card flex flex-col gap-6 text-center animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight">Ouvir, Transcrever e Cifrar</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Toque no botão e **cante uma frase** do seu louvor. A IA vai transcrever o que você cantou, identificar a música no banco de dados offline, calibrar o tom em tempo real e desenhar a **cifra com os acordes em cima, no tempo certo**!
                </p>
              </div>

              <button
                onClick={startRecordingPhrase}
                className="btn-minimal btn-accent shadow-[0_4px_25px_rgba(255,102,0,0.15)] py-4 text-base bg-[#ff6600] hover:bg-[#e05900] text-white rounded-2xl flex items-center justify-center gap-2"
              >
                <Mic size={18} /> Cantar Louvor no Ensaio
              </button>
            </div>
          )}

          {step === "listening" && (
            <div className="minimal-card flex flex-col gap-6 text-center animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#ff6600] uppercase tracking-wider">
                  <span className="dot-indicator active bg-[#ff6600] shadow-[0_0_8px_#ff6600] animate-pulse" />
                  Escutando Frequências e Voz...
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Cante a Frase Musical</h2>
              </div>

              <div className="minimal-wave-container bg-orange-50 border-orange-100 border">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  <span>Gravando Áudio e Letra</span>
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

          {step === "result" && estimatedScale && loadedSong && currentProgression && (
            <div className="minimal-card flex flex-col gap-6 animate-[slideIn_0.3s_ease] border-t-4 border-t-[#ff6600]">
              {/* Success Banner */}
              <div className="flex justify-between items-center border-b border-[var(--border-light)] pb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Reconhecimento IA</span>
                  <span className="text-sm font-extrabold text-[#ff6600]">
                    {loadedSong.title.startsWith("Melodia Improvisada") ? "Voz Transcrevida" : "Música Reconhecida!"}
                  </span>
                </div>
                
                <button 
                  onClick={saveSongToOfflineLibrary}
                  className="flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full border border-orange-200 transition-colors"
                >
                  <Bookmark size={11} className="text-[#ff6600]" />
                  Salvar Offline
                </button>
              </div>

              {/* Informações da Música Reconhecida e Transcrição da Voz */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Música</span>
                  <h3 className="text-lg font-black text-zinc-800 leading-tight">{loadedSong.title}</h3>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase mt-0.5">{loadedSong.artist}</p>
                </div>

                {transcription && (
                  <div className="border-t border-zinc-200 pt-2.5">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">O que a IA ouviu você cantar:</span>
                    <p className="text-xs text-zinc-700 font-semibold italic mt-0.5">"{transcription}"</p>
                  </div>
                )}
              </div>

              {/* Tom de Acompanhamento */}
              <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl py-3.5 px-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Tom de Execução</span>
                  <span className="text-2xl font-black text-orange-950 mt-0.5 leading-none">
                    {getScaleHeroCifra(estimatedScale)} ({estimatedScale.type === "minor" ? "Menor" : "Maior"})
                  </span>
                </div>

                {/* Transpose buttons */}
                <div className="flex items-center gap-1.5 bg-white border border-orange-200 p-1 rounded-xl shadow-sm">
                  <button
                    onClick={() => setTransposeSemitones(prev => prev - 1)}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-[#ff6600] rounded-lg transition-colors"
                    title="Diminuir Tom (-1 semitom)"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-bold w-7 text-center text-zinc-800">
                    {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
                  </span>
                  <button
                    onClick={() => setTransposeSemitones(prev => prev + 1)}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-[#ff6600] rounded-lg transition-colors"
                    title="Aumentar Tom (+1 semitom)"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* EXIBIÇÃO DE CIFRA INTERATIVA COM CHORDS HOVERING NO TEMPO CERTO */}
              <div className="flex flex-col gap-2.5 pt-1 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-1.5">
                  <Music size={12} className="text-[#ff6600]" />
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                    Folha de Cifra do Ensaio
                  </span>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-inner max-h-[350px] overflow-y-auto">
                  {renderTransposedCifra(loadedSong.lyrics)}
                </div>
              </div>

              {/* CADÊNCIAS DE ENCERRAMENTO (FINALIZAÇÕES ONEMOTION) */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-1.5">
                  <Anchor size={12} className="text-[#ff6600]" />
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                    Opções de Cadência de Encerramento (Recomendadas)
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {getTransposedCadences().map((cad, idx) => (
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
                  <RefreshCw size={14} /> Ouvir Outro Louvor
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ABA DA BIBLIOTECA OFFLINE */}
      {activeTab === "biblioteca" && (
        <div className="minimal-card flex flex-col gap-5 animate-[slideIn_0.3s_ease] border-t-4 border-t-zinc-800">
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">Biblioteca Musical Offline</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Pesquise e abra cifras salvas para usar offline nos ensaios. Todas as alterações e transposições salvas estão preservadas localmente!
            </p>
          </div>

          <div className="flex items-center gap-2 border border-zinc-200 p-2 rounded-xl bg-zinc-50">
            <Search size={16} className="text-zinc-400 ml-1" />
            <input
              type="text"
              placeholder="Pesquisar por título, letra ou acordes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-zinc-800 w-full"
            />
          </div>

          <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto">
            {filteredOfflineSongs.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 italic">
                Nenhum louvor encontrado na biblioteca offline.
              </div>
            ) : (
              filteredOfflineSongs.map(song => (
                <div
                  key={song.id}
                  onClick={() => loadOfflineSongDirectly(song)}
                  className="bg-white border border-zinc-200 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#ff6600] shadow-sm transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-orange-600 tracking-wider">Tom Original: {song.originalKey}</span>
                    <h4 className="text-sm font-extrabold text-zinc-800 leading-tight">{song.title}</h4>
                    <span className="text-[10px] text-zinc-500">{song.artist}</span>
                  </div>

                  <button
                    onClick={(e) => deleteFromOfflineLibrary(song.id, e)}
                    className="p-2 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl transition-colors border border-zinc-200"
                    title="Excluir da biblioteca offline"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APP EXPLANATION FOOTER */}
      <footer className="flex gap-1.5 items-start p-3 bg-white border border-[var(--border-light)] rounded-xl text-[10px] text-[var(--text-secondary)] leading-relaxed">
        <Info size={12} className="text-[#ff6600] flex-shrink-0 mt-0.5" />
        <span>
          O Louvor IA é offline-first (PWA) e funciona 100% sem internet no celular. Ele reconhece a música que você canta, exibe a cifra com os acordes pairando no tempo certo, permite que você transponha o tom em tempo real e salve louvores na biblioteca offline do ensaio.
        </span>
      </footer>
    </div>
  );
}
