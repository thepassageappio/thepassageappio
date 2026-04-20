import { useState } from "react";

const TALLY_URL = "https://tally.so/r/q4Ev05";

export default function Home() {
  const [step, setStep] = useState("landing");

  // 👇 send user to Tally WITH context (green vs red flow)
  const goToTally = (flow) => {
    window.location.href = `${TALLY_URL}?flow_type=${flow}`;
  };

  // ---------------- LANDING ----------------
  if (step === "landing") {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>
          Your family shouldn't have to figure it out while they're grieving.
        </h1>

        <p style={styles.subtitle}>
          Capture everything now so your plan executes when it matters most.
        </p>

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

  // ---------------- ONBOARDING ----------------
  if (step === "onboarding") {
    return (
      <div style={styles.page}>
        <h2>Who are you protecting?</h2>

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

// ---------------- STYLES ----------------
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    textAlign: "center",
    fontFamily: "system-ui",
  },

  title: {
    fontSize: 42,
    maxWidth: 700,
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 18,
    maxWidth: 500,
    marginBottom: 40,
    color: "#555",
  },

  buttonRow: {
    display: "flex",
    gap: 20,
  },

  greenButton: {
    backgroundColor: "#6b8f71",
    color: "white",
    border: "none",
    padding: "14px 24px",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },

  redButton: {
    backgroundColor: "#c97b7b",
    color: "white",
    border: "none",
    padding: "14px 24px",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },
};
