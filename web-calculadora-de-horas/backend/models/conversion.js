export function convertDays(days) {
  const d = Number(days);
  return {
    horas: d * 24,
    minutos: d * 24 * 60,
    segundos: d * 24 * 60 * 60,
    semanas: Math.floor(d / 7),
    meses: Math.floor(d / 30),
    anos: Math.floor(d / 365),
  };
}
