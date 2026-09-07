import type { Metadata } from "next";
import Link from "next/link";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import { blogPosts } from "@/lib/blog/posts";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "Plain-English answers and operating guidance for financial power of attorney requests.",
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/feed.xml" },
  },
};

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <CommercialHeader active="blog" />
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Passage Authority blog</p>
          <h1>Clear answers about financial authority.</h1>
        </div>
        <p className={styles.heroIntro}>Practical explanations for families and the institution teams that review power of attorney requests.</p>
      </section>
      <section className={styles.posts} aria-label="Latest articles">
        {blogPosts.map((post) => (
          <Link className={styles.postCard} href={`/blog/${post.slug}`} key={post.slug}>
            <div className={styles.postMeta}>{post.category}<br />{post.readingTime}</div>
            <div>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
            </div>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
      <CommercialFooter />
    </main>
  );
}
