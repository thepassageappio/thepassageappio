import { useState } from "react";

const TALLY_URL = "https://tally.so/r/q4Ev05";

export default function Home() {
  const [step, setStep] = useState("landing");

  const goToTally = (flow) => {
    if (typeof window !== "undefined") {
      window.location.href = `${TALLY_URL}?flow_type=${flow}`;
    }
  };

  // LANDING
  if (step === "landing") {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Passage</h1>

        <div style={styles.buttonRow}>
          <button
            style={styles.greenButton}
            onClick={() => setStep("onboarding")}
          >
            Start planning now →
          </button>

          <button
            style={styles.redButton}
            onClick={() => goToTally("emergency")}
          >
            Someone just passed →
          </button>
        </div>
      </div>
    );
  }

  // ONBOARDING
  if (step === "onboarding") {
    return (
      <div style={styles.page}>
        <h2 style={styles.subtitle}>Who are you protecting?</h2>

        <button
          style={styles.greenButton}
          onClick={() => goToTally("planning")}
        >
          Continue →
        </button>
      </div>
    );
  }

  return null;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    fontFamily: "system-ui",
  },
  title: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 24,
  },
  buttonRow: {
    display: "flex",
    gap: 16,
  },
  greenButton: {
    background: "#6b8f71",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
  redButton: {
    background: "#c97b7b",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
