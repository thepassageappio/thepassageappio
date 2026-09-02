"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="centered-page">
          <p>Passage Authority</p>
          <h1>We could not load this page.</h1>
          <button onClick={reset} type="button">Try again</button>
        </main>
      </body>
    </html>
  );
}
