import type { ReactNode } from 'react';
import { StartWizardProvider } from './StartWizardContext';

export default function StartLayout({ children }: { children: ReactNode }) {
  return <StartWizardProvider>{children}</StartWizardProvider>;
}
