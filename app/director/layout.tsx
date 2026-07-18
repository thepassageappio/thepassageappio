import type { ReactNode } from 'react';
import { OperationalBoundary } from '@/components/auth/OperationalBoundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DirectorLayout({ children }: { children: ReactNode }) {
  return <OperationalBoundary requestedPath="/director" requiredWorkspace="/director">{children}</OperationalBoundary>;
}
