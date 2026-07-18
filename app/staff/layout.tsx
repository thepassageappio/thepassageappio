import type { ReactNode } from 'react';
import { OperationalBoundary } from '@/components/auth/OperationalBoundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <OperationalBoundary requestedPath="/staff" requiredWorkspace="/staff">{children}</OperationalBoundary>;
}
