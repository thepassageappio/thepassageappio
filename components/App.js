import { useState, useEffect } from "react";

const C = {
  bg: "#f6f3ee", bgCard: "#ffffff", bgSubtle: "#f0ece5", bgSage: "#e8eeea",
  bgDark: "#1e1e1a", ink: "#1a1916", mid: "#6a6560", soft: "#a09890",
  muted: "#c5bdb5", border: "#e4ddd4", sage: "#6b8f71", sageDark: "#4a6e50",
  sageLight: "#c8deca", sageFaint: "#f0f5f1", gold: "#b8945a", goldFaint: "#faf4eb",
  rose: "#c47a7a", roseFaint: "#fdf3f3", amber: "#b07a3a",
};

// KEEP THIS (no changes)
const saveLead = async (data) => {
  try {
    await fetch('/api/saveLead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('Lead save failed:', err);
  }
};

// KEEP EVERYTHING ELSE EXACTLY THE SAME ABOVE THIS LINE
// (ALL your components remain unchanged — Landing, Onboarding, etc.)

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");
  const [successMode, setSuccessMode] = useState("paid");

  // 🔥 ONLY CHANGE #1
  const handlePlanComplete = async (mode = "paid") => {
    // optional: still log internally if you want
    await saveLead({
      flow_type: "planning",
      mode: mode,
    });

    // redirect to Tally AFTER onboarding
    window.location.href = "https://tally.so/r/q4Ev05?flow_type=green";
  };

  // 🔥 ONLY CHANGE #2
  const handleEmergencyComplete = async (mode = "emergency_paid") => {
    await saveLead({
      flow_type: "immediate",
      mode: mode,
    });

    window.location.href = "https://tally.so/r/q4Ev05?flow_type=red";
  };

  return (
    <>
      {view === "landing" && (
        <Landing onPlan={() => setView("plan")} onEmergency={() => setView("emergency")} />
      )}
      {view === "plan" && (
        <PlannedOnboarding onComplete={handlePlanComplete} onBack={() => setView("landing")} />
      )}
      {view === "emergency" && (
        <EmergencyOnboarding onComplete={handleEmergencyComplete} onBack={() => setView("landing")} />
      )}
      {view === "success" && <Success mode={successMode} />}
    </>
  );
}
