// ONLY BUTTONS UPDATED — EVERYTHING ELSE UNCHANGED

import { useState, useEffect } from "react";

const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5", bgSage: "#e8eeea",
  bgDark: "#1e1e1a", ink: "#1a1916", mid: "#6a6560", soft: "#a09890",
  muted: "#c5bdb5", border: "#e4ddd4", sage: "#6b8f71", sageDark: "#4a6e50",
  sageLight: "#c8deca", sageFaint: "#f0f5f1", gold: "#b8945a", goldFaint: "#faf4eb",
  rose: "#c47a7a", roseFaint: "#fdf3f3", amber: "#b07a3a",
};

const Btn = ({ children, variant = "primary", style = {} }) => {
  const base = {
    border: "none",
    borderRadius: 14,
    padding: "15px 28px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const variants = {
    primary: { background: C.sage, color: "#fff" },
    rose: { background: C.rose, color: "#fff" },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

function Landing() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: 40 }}>

      {/* NAV */}
      <a href="https://tally.so/r/q4Ev05?flow_type=green" style={{ textDecoration: "none" }}>
        <Btn style={{ marginBottom: 40 }}>Get started free</Btn>
      </a>

      <h1>Your family shouldn't have to figure it out</h1>

      {/* HERO */}
      <div style={{ marginTop: 40, display: "flex", gap: 12 }}>

        <a href="https://tally.so/r/q4Ev05?flow_type=green" style={{ textDecoration: "none" }}>
          <Btn>Start planning now →</Btn>
        </a>

        <a href="https://tally.so/r/q4Ev05?flow_type=red" style={{ textDecoration: "none" }}>
          <Btn variant="rose">Someone just passed ↗</Btn>
        </a>

      </div>

      {/* CTA */}
      <div style={{ marginTop: 60 }}>

        <a href="https://tally.so/r/q4Ev05?flow_type=green" style={{ textDecoration: "none" }}>
          <Btn>Start planning — it's free →</Btn>
        </a>

        <br /><br />

        <a href="https://tally.so/r/q4Ev05?flow_type=red" style={{ textDecoration: "none" }}>
          <Btn variant="rose">Someone just passed</Btn>
        </a>

      </div>

    </div>
  );
}

export default function App() {
  return <Landing />;
}
