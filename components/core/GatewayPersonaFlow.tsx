'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Persona } from '@/lib/demo';

type GatewayPersonaFlowProps = {
  personas: Persona[];
};

function isModifiedActivation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export function GatewayPersonaFlow({ personas }: GatewayPersonaFlowProps) {
  const pathname = usePathname();
  const pendingIdRef = useRef<Persona['id'] | null>(null);
  const [pendingId, setPendingId] = useState<Persona['id'] | null>(null);

  useEffect(() => {
    function resetPending() {
      pendingIdRef.current = null;
      setPendingId(null);
    }

    resetPending();
    window.addEventListener('pageshow', resetPending);
    return () => window.removeEventListener('pageshow', resetPending);
  }, [pathname]);

  function handleActivation(event: MouseEvent<HTMLAnchorElement>, persona: Persona) {
    if (event.defaultPrevented || isModifiedActivation(event)) return;
    if (pendingIdRef.current) {
      event.preventDefault();
      return;
    }

    pendingIdRef.current = persona.id;
    setPendingId(persona.id);
  }

  const pendingPersona = personas.find((persona) => persona.id === pendingId);

  return (
    <>
      <ol className="persona-flow">
        {personas.map((persona) => {
          const isPending = persona.id === pendingId;
          return (
            <li className={`persona persona--${persona.state}`} key={persona.id}>
              <Link
                aria-busy={isPending || undefined}
                aria-label={persona.accessibleName}
                href={persona.href}
                onClick={(event) => handleActivation(event, persona)}
              >
                <span className="persona__meta">
                  <b className="persona__boundary">{persona.boundary}</b>
                  <span className="persona__number">{persona.order}</span>
                </span>
                <span className="persona__identity"><strong>{persona.name}</strong><small>{persona.role}</small></span>
                <span className="persona__action"><b>{persona.action}</b><small>{persona.detail}</small></span>
                <span className="persona__enter">{isPending ? persona.pendingLabel : persona.cta} <i aria-hidden="true">→</i></span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {pendingPersona?.pendingLabel ?? ''}
      </p>
    </>
  );
}
