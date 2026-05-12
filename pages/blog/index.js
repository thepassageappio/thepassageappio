import Head from 'next/head';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';
import { blogPosts } from '../../lib/blogPosts';

const C = {
  bg: '#f6f3ee', card: '#ffffff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890',
  border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1',
};

export default function BlogIndex() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <Head>
        <title>Passage Blog | Family coordination before, during, and after death</title>
        <meta name="description" content="Guides for families, funeral homes, hospice teams, and care providers navigating the practical work before, during, and after a death." />
      </Head>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 24px 70px' }}>
        <div style={{ maxWidth: 760, marginBottom: 26 }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>Passage Blog</div>
          <h1 style={{ fontSize: 'clamp(42px, 6vw, 76px)', lineHeight: .94, letterSpacing: 0, fontWeight: 400, margin: '0 0 14px' }}>Calm guidance for the practical side of loss.</h1>
          <p style={{ color: C.mid, fontSize: 18, lineHeight: 1.55, margin: 0 }}>Thoughtful guides for families, funeral homes, hospice teams, vendors, and helpers working through one shared transition.</p>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {blogPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 14px 34px rgba(55,45,35,.05)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end' }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>{post.category}</div>
                  <h2 style={{ fontSize: 31, lineHeight: 1.08, margin: '0 0 10px', fontWeight: 400 }}>{post.title}</h2>
                  <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.55, margin: 0 }}>{post.excerpt}</p>
                </div>
                <span style={{ color: C.sage, border: '1px solid #c8deca', background: C.sageFaint, borderRadius: 999, padding: '10px 14px', fontWeight: 900, whiteSpace: 'nowrap' }}>Read guide</span>
              </article>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
