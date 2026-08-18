import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopShell } from '@/components/core';
import { blogPosts, getBlogPost } from '@/lib/blog-posts';
import styles from '../Blog.module.css';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Blog' };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

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
    <TopShell context="Blog" mode="gateway">
      <main className={styles.article} id="main-content">
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} type="application/ld+json" />
        <div className={styles.articleLayout}>
          <div className={styles.articleHead}>
            <Link className={styles.readMore} href="/blog">← Back to Blog</Link>
            <p className={styles.articleMeta}>{post.category} · {post.date}</p>
            <h1 className={styles.articleTitle}>{post.title}</h1>
            <p className={styles.articleExcerpt}>{post.excerpt}</p>
            <div className={styles.audienceRow}>
              {post.audience.map((item) => <span className={styles.audienceTag} key={item}>{item}</span>)}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <p className={styles.sidebarEyebrow}>Start here</p>
            <p className={styles.sidebarBody}>Passage helps families organize the practical work before, during, and after a death.</p>
            <div className={styles.sidebarLinks}>
              <Link className={styles.crossLinkCta} href="/start" style={{ width: '100%' }}>Start urgent help</Link>
              <Link className={styles.readMore} href="/pricing" style={{ width: '100%' }}>Plan ahead</Link>
              <Link className={styles.readMore} href="/guides" style={{ width: '100%' }}>Open free guides</Link>
              <Link className={styles.readMore} href="/contact" style={{ width: '100%' }}>Talk to Passage</Link>
            </div>
          </aside>
        </div>

        <div className={styles.body}>
          {post.sections.map((section) => (
            <section className={styles.postSection} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </section>
          ))}

          {post.faqs.length > 0 && (
            <section className={styles.faqBlock}>
              <p className={styles.articleMeta}>FAQ</p>
              {post.faqs.map(([question, answer]) => (
                <div className={styles.faqItem} key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </TopShell>
  );
}
