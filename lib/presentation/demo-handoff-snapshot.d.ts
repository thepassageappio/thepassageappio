import type { DemoHandoffSnapshot } from '../../components/family/types';

export const DEMO_HANDOFF_SCHEMA: 'passage.family.handoff';
export const DEMO_HANDOFF_VERSION: 1;

export function createDemoHandoffSnapshot(
  input: Omit<DemoHandoffSnapshot, 'schema' | 'version'>,
): DemoHandoffSnapshot | null;

export function normalizeDemoHandoffSnapshot(
  value: unknown,
): DemoHandoffSnapshot | null;
