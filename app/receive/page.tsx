import { Suspense } from 'react';
import { ReceiveWorkspace } from '../../components/operations/ReceiveWorkspace';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';

export default function ReceivePage() {
  return <PassageZeroProvider><Suspense fallback={<div aria-busy="true">Opening secure handoff…</div>}><ReceiveWorkspace /></Suspense></PassageZeroProvider>;
}
