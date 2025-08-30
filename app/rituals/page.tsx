'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Rituals from '@/components/Rituals';

function RitualsContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const ritualId = searchParams.get('ritual');
  const allowedModes = ['home', 'view', 'edit', 'new'] as const;
  const mode = allowedModes.includes(modeParam as any) ? (modeParam as (typeof allowedModes)[number]) : undefined;

  return <Rituals initialMode={mode} initialRitualId={ritualId} />;
}

export default function RitualsPage() {
  return (
    <main className="p-6">
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
        <RitualsContent />
      </Suspense>
    </main>
  );
}
