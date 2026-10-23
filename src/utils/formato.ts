const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function formatarData(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === amanha.toDateString()) return 'Amanhã';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${DIAS_CURTOS[d.getDay()]}, ${dia}/${mes}`;
}

export function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatarMoeda(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

export function formatarDiasSemana(dias: number[]) {
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => dias.includes(d))) return 'seg a sex';
  return [...dias]
    .sort()
    .map((d) => DIAS_CURTOS[d])
    .join(', ');
}

/** Junta data (AAAA-MM-DD) e hora (HH:MM) em um ISO no fuso local. */
export function combinarDataHora(data: string, hora: string) {
  const [a, m, d] = data.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(a, m - 1, d, h, min).toISOString();
}

export function hojeISO(somarDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + somarDias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
