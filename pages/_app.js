import Head from 'next/head';

const SITE_URL = 'https://www.thepassageapp.io';
const DESCRIPTION = 'Passage gives families, participants, funeral homes, and trusted vendors one calm place to coordinate tasks, owners, messages, proof, and next steps before, during, and after a death.';

export default function PassageApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Passage | One calm place for life-to-death transitions</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Passage" />
        <meta property="og:title" content="Passage | One calm place for life-to-death transitions" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Passage | One calm place for life-to-death transitions" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Passage',
              url: SITE_URL,
              email: 'thepassageappio@gmail.com',
              description: DESCRIPTION,
            }),
          }}
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
