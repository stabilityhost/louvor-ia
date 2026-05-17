# 🎙️ Louvor IA - Progressão Harmônica Minimalista por Captação de Frase

Uma plataforma web **clean, minimalista, branca (light mode)** e **phone-first** projetada especificamente para celulares e uso prático imediato ao vivo.

Em vez de exibir um afinador que treme nota por nota em tempo real, o site permite que você **cante uma frase musical por 6 segundos, para de ouvir sozinho e define de forma certa o tom, as notas cantadas e a sequência de acordes ideal do campo harmônico** para você tocar no seu instrumento.

---

## ✨ Como Funciona o Fluxo de Uso (3 Etapas)

1. **Etapa 1: Preparação**:
   * O usuário visualiza uma interface limpa com um botão de destaque royal blue: **"🎙️ Cantar Frase Musical"**.
   
2. **Etapa 2: Captação Automática (6 segundos)**:
   * Ao clicar, o microfone abre e grava por 6 segundos.
   * Exibe um osciloscópio de onda minimalista azul e uma barra de progresso linear.
   * Não há flicker ou tremelique de notas na tela.
   * **Após 6 segundos, o microfone é desligado automaticamente**.

3. **Etapa 3: Resultados de Teoria Musical**:
   * O site exibe o **Tom Identificado** (ex: *Dó# Menor / C#m*).
   * Exibe a lista organizada de **Notas Identificadas na Melodia** (ex: *Dó# ➔ Mi ➔ Fá# ➔ Sol#*).
   * Exibe a **Sequência de Acordes do Campo Harmônico** recomendada para o seu instrumento (ex: **`C#m ➔ E ➔ F# ➔ G`** ou **`C#m ➔ A ➔ E ➔ B`**), incluindo as funções harmônicas e cifras simplificadas.

---

## 🧮 IA e Teoria Musical "De Forma Certa"

Para gerar a sequência de acordes perfeita para o seu canto, o sistema:
1. Analisa as notas captadas nos 6 segundos contra as escalas diatônicas principais e menores.
2. Mapeia as 7 tríades diatônicas do campo harmônico do tom definido.
3. Compara progressões de adoração consagradas e seleciona a sequência que **possui a maior afinidade e sobreposição harmônica** com as notas que você cantou.
4. Exibe a sequência de forma limpa e em português (ex: *Ré Menor (Dm) ➔ Fá Maior (F) ➔ Sol Menor (Gm) ➔ Lá Menor (Am)*).

---

## 🚀 Como Executar Localmente

### 1. No Computador
Abra o console PowerShell ou terminal no diretório do projeto e execute:
```powershell
cd C:\Users\Gabriel\.gemini\antigravity\scratch\louvor-inteligente
npm install
npm run dev
```
Abra seu navegador no endereço: **`http://localhost:3000`**

### 2. No Celular
Certifique-se de que o computador e o celular estão na mesma rede Wi-Fi.
1. Obtenha o IP local do seu computador no terminal (ex: `192.168.1.15`).
2. No celular, acesse: **`http://192.168.1.15:3000`**
3. O aplicativo adapta-se imediatamente ao celular e funciona perfeitamente offline (PWA)!
