import type { ReactNode } from 'react';
import { PartnerBoundary } from '@/components/auth/PartnerBoundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <PartnerBoundary>{children}</PartnerBoundary>;
}
