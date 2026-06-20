import Head from 'next/head';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';
import { blogPosts, getBlogPost } from '../../lib/blogPosts';
import { calendlyUrl } from '../../lib/scheduling';

const C = {
  bg: '#f6f3ee', card: '#ffffff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890',
  border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', roseFaint: '#fdf3f3', rose: '#c47a7a',
};

export async function getStaticPaths() {
  return { paths: blogPosts.map(post => ({ params: { slug: post.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { post: getBlogPost(params.slug) } };
}

export default function BlogPost({ post }) {
  const url = `https://www.thepassageapp.io/blog/${post.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt || post.date,
    author: { '@type': 'Organization', name: 'Passage' },
    publisher: { '@type': 'Organization', name: 'Passage' },
    mainEntityOfPage: url,
  };
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <Head>
        <title key="title">{post.title} | Passage</title>
        <meta key="description" name="description" content={post.excerpt} />
        <link key="canonical" rel="canonical" href={url} />
        <meta key="og:type" property="og:type" content="article" />
        <meta key="og:title" property="og:title" content={post.title} />
        <meta key="og:description" property="og:description" content={post.excerpt} />
        <meta key="og:url" property="og:url" content={url} />
        <meta key="twitter:title" name="twitter:title" content={post.title} />
        <meta key="twitter:description" name="twitter:description" content={post.excerpt} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </Head>
      <SiteHeader />
      <article style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px 70px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 28, alignItems: 'start' }}>
          <div>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>{post.category} / {post.date}</div>
            <h1 style={{ fontSize: 52, lineHeight: .94, fontWeight: 400, margin: '0 0 14px' }}>{post.title}</h1>
            <p style={{ color: C.mid, fontSize: 19, lineHeight: 1.5, margin: '0 0 18px' }}>{post.excerpt}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {post.audience.map(item => <span key={item} style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900 }}>{item}</span>)}
            </div>
          </div>

          <aside style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 12px 30px rgba(55,45,35,.045)' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Start here</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.55, margin: '0 0 14px' }}>Passage helps families organize the practical work before, during, and after a death.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              <Link href="/urgent" style={cta(C.ink, '#fff', C.ink)}>Start urgent help</Link>
              <Link href="/?start=plan" style={cta(C.sage, '#fff', C.sage)}>Plan ahead</Link>
              <Link href="/guides" style={cta(C.sageFaint, C.sage, '#c8deca')}>Open free guides</Link>
              <a href={calendlyUrl({ source: 'blog-funeral-home' })} target="_blank" rel="noreferrer" style={cta(C.card, C.sage, '#c8deca')}>Book partner walkthrough</a>
            </div>
          </aside>
        </div>

        <div style={{ maxWidth: 760 }}>
          {post.sections.map(section => (
            <section key={section.heading} style={{ marginTop: 30 }}>
              <h2 style={{ fontSize: 30, lineHeight: 1.12, margin: '0 0 10px', fontWeight: 400 }}>{section.heading}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index} style={{ color: C.mid, fontSize: 17, lineHeight: 1.72, margin: '0 0 14px' }}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section style={{ marginTop: 34, background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>FAQ</div>
            {post.faqs.map(([question, answer]) => (
              <div key={question} style={{ borderTop: `1px solid ${C.border}`, padding: '13px 0' }}>
                <h3 style={{ margin: '0 0 5px', fontSize: 18 }}>{question}</h3>
                <p style={{ margin: 0, color: C.mid, fontSize: 15.5, lineHeight: 1.55 }}>{answer}</p>
              </div>
            ))}
          </section>
        </div>
      </article>
      <style jsx>{`
        @media (max-width: 820px) {
          article > div { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}

function cta(background, color, border) {
  return {
    minHeight: 46,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    background,
    color,
    border: `1px solid ${border}`,
    textDecoration: 'none',
    fontWeight: 900,
    padding: '0 14px',
    textAlign: 'center',
  };
}
