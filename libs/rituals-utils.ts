// Utility functions for the Rituals application

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (s: number) => {
  const sign = s < 0 ? '-' : '';
  const v = Math.abs(Math.trunc(s));
  const m = Math.floor(v / 60);
  const sec = v % 60;
  return `${sign}${m}:${String(sec).padStart(2, '0')}`;
};
