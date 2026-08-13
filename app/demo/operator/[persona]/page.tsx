import { notFound } from 'next/navigation';
import { OperatorDemo, type OperatorPersona } from '../OperatorDemo';

const personas = new Set<OperatorPersona>(['director', 'staff', 'vendor']);

export default async function GuidedOperatorDemoPage({ params }: { params: Promise<{ persona: string }> }) {
  const { persona } = await params;
  if (!personas.has(persona as OperatorPersona)) notFound();
  return <OperatorDemo persona={persona as OperatorPersona} />;
}
