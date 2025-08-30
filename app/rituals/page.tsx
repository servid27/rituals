'use client';
import { useSearchParams } from 'next/navigation';
import Rituals from '@/components/Rituals';

export default function RitualsPage() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const ritualId = searchParams.get('ritual');
  const allowedModes = ['home', 'view', 'edit', 'new'] as const;
  const mode = allowedModes.includes(modeParam as any) ? (modeParam as (typeof allowedModes)[number]) : undefined;

  return (
    <main className="p-6">
      <Rituals initialMode={mode} initialRitualId={ritualId} />
    </main>
  );
}
