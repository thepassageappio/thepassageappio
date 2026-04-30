import { useState, useEffect } from 'react';

const T = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  subtle: '#f0ece5',
  sage: '#6b8f71',
  sageLight: '#c8deca',
};

function buildOutcomes() {
  return [
    {
      id: 'funeral',
      phase: 'NOW',
      title: 'Funeral arrangements',
      support: 'This is the most important thing to begin with.',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'family',
      phase: 'TODAY',
      title: 'Notify immediate family',
      support: 'Close family should hear directly first.',
      status: 'needs_owner',
      owner: null,
      priority: 'critical',
    },
    {
      id: 'home',
      phase: 'NEXT',
      title: 'Secure home, pets, and vehicle',
      support: 'This prevents avoidable issues.',
      status: 'needs_owner',
      owner: null,
      priority: 'high',
    },
  ];
}

function Reassurance({ outcomes }) {
  const needsOwner = outcomes.filter(
    o => o.priority === 'critical' && o.status === 'needs_owner'
  ).length;

  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontSize: 24 }}>
        {needsOwner > 0 ? "You're still on track." : "You're on track."}
      </div>
      <div style={{ fontSize: 15 }}>
        {needsOwner > 0
          ? "A few things need an owner before they're fully handled."
          : "Nothing urgent is missing right now."}
      </div>
      <div style={{ fontSize: 15 }}>
        We’ll walk you through what matters next.
      </div>
    </div>
  );
}

function PrimaryCard({ outcome, onStart, onAssign, onHandled }) {
  const isHandled = outcome.status === 'handled';

  return (
    <div style={{ padding: 20, border: '2px solid ' + T.sage, marginBottom: 30 }}>
      <div style={{ fontSize: 20 }}>Start here</div>
      <div style={{ fontSize: 18 }}>{outcome.title}</div>
      <div style={{ marginBottom: 20 }}>{outcome.support}</div>

      {outcome.owner ? (
        <div>
          {outcome.owner} is handling this.<br />
          You don’t need to take this on.
        </div>
      ) : (
        <div>No one is handling this yet.</div>
      )}

      {!isHandled && (
        <>
          {outcome.status === 'needs_owner' && (
            <button onClick={onAssign}>Assign owner</button>
          )}
          {outcome.status === 'not_started' && (
            <button onClick={onStart}>Start</button>
          )}
          {outcome.status === 'in_progress' && (
            <button onClick={onHandled}>Mark handled</button>
          )}
        </>
      )}

      {isHandled && (
        <div>
          That’s taken care of.<br />
          You’re all set here.
        </div>
      )}
    </div>
  );
}

function Secondary({ outcomes }) {
  if (!outcomes.length) return null;

  return (
    <div style={{ opacity: 0.6, marginBottom: 30 }}>
      <div>This can wait</div>
      {outcomes.map(o => (
        <div key={o.id}>{o.phase} — {o.title}</div>
      ))}
    </div>
  );
}

function Pause() {
  return (
    <div style={{ marginBottom: 30 }}>
      You’re in a good place for now.<br />
      Nothing urgent is being missed.<br />
      We’ll be here when you come back.
    </div>
  );
}

export default function UrgentPage() {
  const [outcomes, setOutcomes] = useState([]);
  const [interactions, setInteractions] = useState(0);

  useEffect(() => {
    setOutcomes(buildOutcomes());
  }, []);

  const primary = outcomes.find(o => o.status !== 'handled') || outcomes[0];
  const secondary = outcomes.filter(o => o !== primary);

  const primaryIndex = outcomes.indexOf(primary);

  const handleStart = () => {
    update(primaryIndex, 'in_progress');
  };

  const handleAssign = () => {
    const name = "Ashlee";
    update(primaryIndex, 'in_progress', name);
  };

  const handleHandled = () => {
    update(primaryIndex, 'handled');
  };

  const update = (i, status, owner = null) => {
    setOutcomes(prev =>
      prev.map((o, idx) =>
        idx === i ? { ...o, status, owner: owner || o.owner } : o
      )
    );
    setInteractions(x => x + 1);
  };

  const handledCount = outcomes.filter(o => o.status === 'handled').length;
  const showPause = handledCount >= 1 || interactions >= 2;

  if (!primary) return null;

  return (
    <div style={{ padding: 30 }}>
      <Reassurance outcomes={outcomes} />

      <PrimaryCard
        outcome={primary}
        onStart={handleStart}
        onAssign={handleAssign}
        onHandled={handleHandled}
      />

      <Secondary outcomes={secondary} />

      {showPause && <Pause />}
    </div>
  );
}
