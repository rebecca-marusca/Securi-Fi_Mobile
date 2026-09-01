export const colors = {
  white: '#ffffff',
  black: '#000000',
  base: '#E7EFEA',
  bgSecondary1: '#DDE7DF',
  bgSecondary2: '#CDD9D5',
  text: '#352D38',
  textMuted: '#4B696E',
  accent: '#3E7466',
  greenWave3: "#386A5A",
  greenWave2: "#2D5A4C",
  greenWave1: "#1E4438",
  alert: "#B3453D",
  redWave3: "#fc6161",
  redWave2: "#ea4444",
  redWave1: "#e20909", // movement detected
  slightMovement: "#f8b04b",
  noMovement:  'rgb(64, 144, 79)',
  intermediate: "#707070"
};

export type ColorToken = keyof typeof colors;