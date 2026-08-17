import Link from 'next/link';
import { TopShell } from '@/components/core';
import { getSortedBlogPosts } from '@/lib/blog-posts';
import marketingStyles from '@/components/marketing/MarketingPage.module.css';
import styles from './Blog.module.css';

export const metadata = { title: 'Blog' };

export default function BlogIndexPage() {
  const posts = getSortedBlogPosts();
  return (
    <TopShell mode="gateway" context="Blog">
      <main id="main-content" className={marketingStyles.page}>
        <section className={marketingStyles.hero}>
          <p className={marketingStyles.eyebrow}>Passage Blog</p>
          <h1>Calm guidance for the practical side of loss.</h1>
          <p className={marketingStyles.lede}>Thoughtful, free reading for families, funeral homes, hospice teams, vendors, and helpers working through one shared transition. No email required.</p>
        </section>

        <section className={marketingStyles.section}>
          <Link className={styles.crossLink} href="/guides">
            <span>
              <span className={styles.crossLinkEyebrow}>Free guides</span>
              <span className={styles.crossLinkTitle}>Need the practical checklist right now?</span>
              <span className={styles.crossLinkBody}>Unlock the First 24 Hours Guide, family notification playbook, executor checklist, or funeral-home meeting prep.</span>
            </span>
            <span className={styles.crossLinkCta}>Open guides</span>
          </Link>

          <div className={styles.postGrid}>
            {posts.map((post) => (
              <Link className={`${marketingStyles.card} ${styles.postCard}`} href={`/blog/${post.slug}`} key={post.slug}>
                <span>
                  <p className={styles.postMeta}>{post.category} · {post.date}</p>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                </span>
                <span className={styles.readMore}>Read post</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className={marketingStyles.footer}>
          <p>Questions? <Link href="/contact">Contact Passage</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
        </footer>
      </main>
    </TopShell>
  );
}
