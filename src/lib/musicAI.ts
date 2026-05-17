import { NOTE_STRINGS } from "./audioEngine";

// Dicionário de escalas diatônicas (maiores e menores naturais)
// Cada nota inicial (0 a 11) tem um conjunto de 7 notas que pertencem à escala
export interface Scale {
  name: string;
  root: number;
  type: "major" | "minor";
  notes: Set<number>;
}

// Representação de Acorde com inversões e cifras de instrumentos
export interface ChordVoicing {
  name: string;
  root: string;
  notes: string[];
  pianoKeys: number[]; // índices de notas relativas a partir de C4 (0)
  guitarTab: string; // padrão cifra simplificado e.g. "x32010"
}

// Cadência Harmônica sugerida
export interface Cadence {
  name: string;
  romanNumeral: string[];
  description: string;
  chordsInKey: string[]; // acordes já transpostos para o tom
}

// Criar todas as 24 escalas principais (12 maiores, 12 menores)
export const SCALES: Scale[] = [];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

NOTE_STRINGS.forEach((note, index) => {
  // Maior
  const majorNotes = new Set<number>();
  MAJOR_STEPS.forEach((step) => {
    majorNotes.add((index + step) % 12);
  });
  SCALES.push({
    name: `${note} Maior`,
    root: index,
    type: "major",
    notes: majorNotes,
  });

  // Menor
  const minorNotes = new Set<number>();
  MINOR_STEPS.forEach((step) => {
    minorNotes.add((index + step) % 12);
  });
  SCALES.push({
    name: `${note} Menor`,
    root: index,
    type: "minor",
    notes: minorNotes,
  });
});

/**
 * Motor de IA Musical
 */
export class MusicAIEngine {
  // Histórico de notas para detectar o Tom
  private noteHistory: { noteIndex: number; timestamp: number }[] = [];
  private historyDurationMs = 12000; // Analisa notas dos últimos 12 segundos

  // Matriz do Modelo de Markov para previsão da próxima nota
  // model[fromNoteIndex][toNoteIndex] = contagem
  private markovMatrix: number[][] = Array(12)
    .fill(0)
    .map(() => Array(12).fill(0));
  private lastNoteIndex = -1;

  // Acordes tocados recentemente (histórico de acordes)
  private chordHistory: string[] = [];

  /**
   * Adiciona uma nota ao histórico e atualiza a matriz de Markov
   */
  addNoteToHistory(noteIndex: number) {
    if (noteIndex < 0 || noteIndex > 11) return;

    const now = Date.now();
    this.noteHistory.push({ noteIndex, timestamp: now });

    // Atualizar modelo de Markov (Previsão de notas)
    if (this.lastNoteIndex !== -1 && this.lastNoteIndex !== noteIndex) {
      this.markovMatrix[this.lastNoteIndex][noteIndex] += 1;
    }
    this.lastNoteIndex = noteIndex;

    // Limpar histórico antigo
    this.cleanHistory();
  }

  private cleanHistory() {
    const now = Date.now();
    this.noteHistory = this.noteHistory.filter(
      (n) => now - n.timestamp < this.historyDurationMs
    );
  }

  resetHistory() {
    this.noteHistory = [];
    this.lastNoteIndex = -1;
    this.markovMatrix = Array(12)
      .fill(0)
      .map(() => Array(12).fill(0));
    this.chordHistory = [];
  }

  /**
   * Identifica o tom (escala) mais provável baseado no histórico de notas
   */
  estimateKey(): Scale {
    this.cleanHistory();
    if (this.noteHistory.length === 0) {
      // Padrão: C Maior
      return SCALES[0];
    }

    // Contar a frequência de cada nota (0 a 11) no histórico
    const counts = Array(12).fill(0);
    this.noteHistory.forEach((n) => {
      counts[n.noteIndex] += 1;
    });

    let bestScale = SCALES[0];
    let maxScore = -999999;

    // Perfis de peso musical (Krumhansl-Schmuckler adaptados)
    // Tonic = 1.0, Terça = 0.9, Quinta = 0.8, outras notas diatônicas = 0.5, fora da escala = -0.8
    SCALES.forEach((scale) => {
      let score = 0;
      const root = scale.root;
      
      // Definir pesos para cada semitom relativo à tônica da escala
      const weights = Array(12).fill(-0.8); // Penalidade pesada padrão para notas fora da escala
      
      if (scale.type === "major") {
        weights[0] = 1.0;  // Tônica (I)
        weights[2] = 0.5;  // Segunda Maior (ii)
        weights[4] = 0.9;  // Terça Maior (iii)
        weights[5] = 0.5;  // Quarta Justa (IV)
        weights[7] = 0.8;  // Quinta Justa (V)
        weights[9] = 0.5;  // Sexta Maior (vi)
        weights[11] = 0.4; // Sétima Maior (vii)
      } else {
        weights[0] = 1.0;  // Tônica (i)
        weights[2] = 0.5;  // Segunda Maior (ii)
        weights[3] = 0.9;  // Terça Menor (iii)
        weights[5] = 0.5;  // Quarta Justa (iv)
        weights[7] = 0.8;  // Quinta Justa (v)
        weights[8] = 0.4;  // Sexta Menor (VI)
        weights[10] = 0.5; // Sétima Menor (VII)
      }

      // Calcular a pontuação da escala aplicando os pesos sobre as contagens de notas capturadas
      for (let i = 0; i < 12; i++) {
        const relativeSemitone = (i - root + 12) % 12;
        const weight = weights[relativeSemitone];
        score += counts[i] * weight;
      }

      if (score > maxScore) {
        maxScore = score;
        bestScale = scale;
      }
    });

    return bestScale;
  }

  /**
   * Prevê as próximas 3 notas mais prováveis a serem tocadas/cantadas
   * com base na nota atual usando o modelo de Markov treinado localmente
   */
  predictNextNotes(currentNoteIndex: number): { noteName: string; probability: number }[] {
    if (currentNoteIndex < 0 || currentNoteIndex > 11) return [];

    const row = this.markovMatrix[currentNoteIndex];
    const totalTransitions = row.reduce((sum, val) => sum + val, 0);

    if (totalTransitions === 0) {
      // Se não há dados, sugere notas comuns na escala diatônica (ex: terça, quinta)
      const scale = this.estimateKey();
      const suggestions: { noteName: string; probability: number }[] = [];
      
      // Sugerir notas da própria escala
      let count = 0;
      for (let i = 1; i <= 12; i++) {
        const candidate = (currentNoteIndex + i) % 12;
        if (scale.notes.has(candidate) && count < 3) {
          suggestions.push({
            noteName: NOTE_STRINGS[candidate],
            probability: count === 0 ? 0.4 : count === 1 ? 0.3 : 0.2
          });
          count++;
        }
      }
      return suggestions;
    }

    // Mapear probabilidades
    const probs = row.map((count, index) => ({
      noteIndex: index,
      noteName: NOTE_STRINGS[index],
      probability: count / totalTransitions
    }));

    // Ordenar decrescente
    probs.sort((a, b) => b.probability - a.probability);

    // Retornar as top 3
    return probs.slice(0, 3).filter((p) => p.probability > 0);
  }

  /**
   * Sugere acordes adequados para a nota da melodia e o tom estimados.
   * Retorna os acordes com suas respectivas inversões e posições de guitarra.
   */
  suggestChords(melodyNoteIndex: number, currentScale: Scale): ChordVoicing[] {
    if (melodyNoteIndex < 0 || melodyNoteIndex > 11) return [];

    const chordSuggestions: ChordVoicing[] = [];
    const rootNote = NOTE_STRINGS[currentScale.root];
    const isMajor = currentScale.type === "major";

    // Graus diatônicos do tom sugerido
    // Para simplificar, definimos os acordes do campo harmônico maior e menor natural
    const harmonyMap: { [key: string]: { name: string; intervals: number[]; type: string } } = {};

    if (isMajor) {
      // Graus do Campo Harmônico Maior: I, ii, iii, IV, V, vi, vii°
      const degrees = [
        { suffix: "", intervals: [0, 4, 7], degree: 1 }, // I
        { suffix: "m", intervals: [2, 5, 9], degree: 2 }, // ii
        { suffix: "m", intervals: [4, 7, 11], degree: 3 }, // iii
        { suffix: "", intervals: [5, 9, 0], degree: 4 }, // IV
        { suffix: "", intervals: [7, 11, 2], degree: 5 }, // V
        { suffix: "m", intervals: [9, 0, 4], degree: 6 }, // vi
        { suffix: "dim", intervals: [11, 2, 5], degree: 7 } // vii°
      ];

      degrees.forEach((d) => {
        const root = (currentScale.root + (d.degree === 1 ? 0 : d.degree === 2 ? 2 : d.degree === 3 ? 4 : d.degree === 4 ? 5 : d.degree === 5 ? 7 : d.degree === 6 ? 9 : 11)) % 12;
        const chordName = NOTE_STRINGS[root] + d.suffix;
        
        // As notas reais desse acorde
        const absoluteNotes = d.intervals.map((offset) => (currentScale.root + offset) % 12);
        
        // Se a nota da melodia atual faz parte desse acorde, nós sugerimos ele!
        if (absoluteNotes.includes(melodyNoteIndex)) {
          chordSuggestions.push(this.createVoicing(chordName, root, d.suffix === "m"));
        }
      });
    } else {
      // Graus do Campo Harmônico Menor Natural: i, ii°, III, iv, v, VI, VII
      const degrees = [
        { suffix: "m", intervals: [0, 3, 7], degree: 1 }, // i
        { suffix: "dim", intervals: [2, 5, 8], degree: 2 }, // ii°
        { suffix: "", intervals: [3, 7, 10], degree: 3 }, // III
        { suffix: "m", intervals: [5, 8, 0], degree: 4 }, // iv
        { suffix: "m", intervals: [7, 10, 2], degree: 5 }, // v
        { suffix: "", intervals: [8, 0, 3], degree: 6 }, // VI
        { suffix: "", intervals: [10, 2, 5], degree: 7 } // VII
      ];

      degrees.forEach((d) => {
        const root = (currentScale.root + (d.degree === 1 ? 0 : d.degree === 2 ? 2 : d.degree === 3 ? 3 : d.degree === 4 ? 5 : d.degree === 5 ? 7 : d.degree === 6 ? 8 : 10)) % 12;
        const chordName = NOTE_STRINGS[root] + d.suffix;

        const absoluteNotes = d.intervals.map((offset) => (currentScale.root + offset) % 12);
        
        if (absoluteNotes.includes(melodyNoteIndex)) {
          chordSuggestions.push(this.createVoicing(chordName, root, d.suffix === "m"));
        }
      });
    }

    // Se nenhum acorde diatônico contiver a nota, sugerimos pelo menos o acorde do I Grau e IV Grau
    if (chordSuggestions.length === 0) {
      const rootName = NOTE_STRINGS[currentScale.root] + (isMajor ? "" : "m");
      chordSuggestions.push(this.createVoicing(rootName, currentScale.root, !isMajor));
    }

    return chordSuggestions.slice(0, 4); // Retorna no máximo 4 opções
  }

  /**
   * Helper para criar os detalhes de dedilhado de acorde e visualizações
   */
  private createVoicing(name: string, rootIndex: number, isMinor: boolean): ChordVoicing {
    const rootName = NOTE_STRINGS[rootIndex];
    
    // Notas constituintes básicas (Triade)
    const thirdOffset = isMinor ? 3 : 4;
    const fifthOffset = 7;
    
    const thirdIndex = (rootIndex + thirdOffset) % 12;
    const fifthIndex = (rootIndex + fifthOffset) % 12;

    const notes = [rootName, NOTE_STRINGS[thirdIndex], NOTE_STRINGS[fifthIndex]];

    // Definir teclas de piano baseadas em C4 como 0
    // C=0, C#=1, D=2...
    const pianoKeys = [rootIndex, rootIndex + thirdOffset, rootIndex + fifthOffset];

    // Mockar tablaturas de violão comuns (Cifras) para encantar o usuário
    const guitarTabs: { [key: string]: string } = {
      "C": "x32010", "Cm": "x35543",
      "C#": "x46664", "C#m": "x46654",
      "D": "xx0232", "Dm": "xx0231",
      "D#": "x68886", "D#m": "x68876",
      "E": "022100", "Em": "022000",
      "F": "133211", "Fm": "133111",
      "F#": "244322", "F#m": "244222",
      "G": "320003", "Gm": "355333",
      "G#": "466544", "G#m": "466444",
      "A": "x02220", "Am": "x02210",
      "A#": "x13331", "A#m": "x13321",
      "B": "x24442", "Bm": "x24432",
      "Bdim": "x2323x", "Adim": "x0121x",
    };

    // Obter tablatura ou gerar uma genérica por pestana
    let tab = guitarTabs[name] || "xxxxxx";
    if (tab === "xxxxxx" && name.endsWith("dim")) {
      tab = "x" + rootIndex + (rootIndex + 1) + rootIndex + (rootIndex + 1) + "x";
    }

    return {
      name,
      root: rootName,
      notes,
      pianoKeys,
      guitarTab: tab
    };
  }

  /**
   * Sugere cadências harmônicas comuns baseadas no tom estimado
   */
  suggestCadences(scale: Scale): Cadence[] {
    const root = scale.root;
    const isMajor = scale.type === "major";

    // Mapear graus diatônicos em notas
    const getChord = (degree: number, suffix = "") => {
      let offset = 0;
      if (isMajor) {
        // Graus maiores: 1, 2, 3, 4, 5, 6, 7
        const majorOffsets = [0, 0, 2, 4, 5, 7, 9, 11];
        offset = majorOffsets[degree] || 0;
      } else {
        // Graus menores
        const minorOffsets = [0, 0, 2, 3, 5, 7, 8, 10];
        offset = minorOffsets[degree] || 0;
      }
      return NOTE_STRINGS[(root + offset) % 12] + suffix;
    };

    if (isMajor) {
      return [
        {
          name: "Pop Adoração Contemporâneo",
          romanNumeral: ["I", "V", "vi", "IV"],
          description: "A cadência mais famosa do louvor moderno. Dá um tom de elevação espiritual e esperança.",
          chordsInKey: [getChord(1), getChord(5), getChord(6, "m"), getChord(4)]
        },
        {
          name: "Cadência Emocional / Clímax",
          romanNumeral: ["vi", "IV", "I", "V"],
          description: "Foco no sentimento introspectivo antes do refrão de clamor.",
          chordsInKey: [getChord(6, "m"), getChord(4), getChord(1), getChord(5)]
        },
        {
          name: "Cadência Tradicional / Hino",
          romanNumeral: ["I", "IV", "V", "I"],
          description: "Cadência de hinos tradicionais e harpa cristã.",
          chordsInKey: [getChord(1), getChord(4), getChord(5), getChord(1)]
        },
        {
          name: "Cadência Jazz / Resolução",
          romanNumeral: ["ii", "V", "I"],
          description: "A resolução harmônica perfeita e elegante.",
          chordsInKey: [getChord(2, "m"), getChord(5), getChord(1)]
        }
      ];
    } else {
      return [
        {
          name: "Adoração Menor Clássica",
          romanNumeral: ["i", "VI", "III", "VII"],
          description: "Progressão menor épica usada em momentos de guerra espiritual ou adoração solene.",
          chordsInKey: [getChord(1, "m"), getChord(6), getChord(3), getChord(7)]
        },
        {
          name: "Clamor / Lamento",
          romanNumeral: ["i", "iv", "v", "i"],
          description: "Uso introspectivo ideal para orações profundas.",
          chordsInKey: [getChord(1, "m"), getChord(4, "m"), getChord(5, "m"), getChord(1, "m")]
        }
      ];
    }
  }

  /**
   * Converte uma cifra de acorde (ex: "G#m") em seu respectivo grau romano na escala.
   */
  getRomanDegree(chordName: string, scale: Scale): string {
    // Retorna correspondência aproximada do acorde no tom
    const cleanName = chordName.replace("m", "").replace("dim", "");
    const rootName = NOTE_STRINGS[scale.root];
    const isMajor = scale.type === "major";

    // Encontrar diferença em semitons
    const chordRoot = NOTE_STRINGS.indexOf(cleanName);
    if (chordRoot === -1) return "?";

    const semitonesDiff = (chordRoot - scale.root + 12) % 12;

    if (isMajor) {
      const majorDegrees: { [key: number]: string } = {
        0: "I", 2: "ii", 4: "iii", 5: "IV", 7: "V", 9: "vi", 11: "vii°"
      };
      return majorDegrees[semitonesDiff] || "?";
    } else {
      const minorDegrees: { [key: number]: string } = {
        0: "i", 2: "ii°", 3: "III", 5: "iv", 7: "v", 8: "VI", 10: "VII"
      };
      return minorDegrees[semitonesDiff] || "?";
    }
  }
}

export const musicAIInstance = new MusicAIEngine();
