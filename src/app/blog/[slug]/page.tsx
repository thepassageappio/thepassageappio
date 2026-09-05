import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import { blogPosts, getBlogPost } from "@/lib/blog/posts";
import styles from "../blog.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: "Passage Authority" }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      modifiedTime: post.updated,
      authors: ["Passage Authority"],
      images: [{ url: "/passage-authority-og.png", width: 1744, height: 909, alt: "Passage Authority financial POA institution review workflow" }],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleUrl = `https://thepassageapp.io/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: "Passage Authority", url: "https://thepassageapp.io/about" },
    publisher: { "@type": "Organization", name: "Passage Authority", url: "https://thepassageapp.io" },
  };

  return (
    <main className={styles.page}>
      <CommercialHeader active="blog" />
      <article>
        <header className={styles.articleHeader}>
          <p className={styles.category}>{post.category}</p>
          <h1>{post.title}</h1>
          <p className={styles.byline}>By Passage Authority · Published September 4, 2026 · {post.readingTime}</p>
          <p className={styles.answer}><strong>Short answer:</strong> {post.answer}</p>
        </header>
        <div className={styles.articleBody}>
          {post.sections.map((section) => (
            <section className={styles.section} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.points ? <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
            </section>
          ))}
          <section className={styles.questions} aria-labelledby="common-questions">
            <h2 id="common-questions">Common questions</h2>
            {post.questions.map((item) => (
              <div className={styles.question} key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
          <section className={styles.sources} aria-labelledby="sources">
            <h2 id="sources">Sources and further reading</h2>
            <ul className={styles.sourceList}>
              {post.sources.map((source) => <li key={source.href}><a href={source.href} rel="noreferrer">{source.label}</a></li>)}
            </ul>
          </section>
          <p className={styles.disclaimer}>This article explains Passage Authority and general financial power of attorney operations. It is not legal advice, and requirements vary by institution and jurisdiction.</p>
          <Link className={styles.back} href="/blog">← Back to the blog</Link>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <CommercialFooter />
    </main>
  );
}
