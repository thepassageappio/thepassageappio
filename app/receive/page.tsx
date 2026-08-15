import { Suspense } from 'react';
import { ReceiveWorkspace } from '../../components/operations/ReceiveWorkspace';

export default function ReceivePage() {
  return <Suspense fallback={<div aria-busy="true">Opening secure handoff…</div>}><ReceiveWorkspace /></Suspense>;
}
