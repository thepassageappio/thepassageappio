import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Threshold type system (docs/redesign/08-visual-craft-standard.md): Fraunces
            for moments/headlines, Inter for mechanisms/body -- loaded once, globally,
            so every page renders the correct font instead of only the individually
            re-skinned pages that carried their own local @import. See
            docs/redesign-diagnosis-2026-07-14.md for why this was missing. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
