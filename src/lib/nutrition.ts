/** Australia labels food energy in kilojoules: 1 kcal = 4.184 kJ. */
export function kcalToKj(kcal: number) {
  return Math.round(kcal * 4.184);
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-AU');
}
