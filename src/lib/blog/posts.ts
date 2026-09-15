export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  answer: string;
  published: string;
  updated: string;
  readingTime: string;
  category: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    points?: string[];
  }>;
  questions: Array<{ question: string; answer: string }>;
  sources: Array<{ label: string; href: string }>;
};

export const blogPosts: BlogPost[] = [
  {
   slug: "what-passage-is-and-is-not",
   title: "What Passage is (and is not)",
   description:
   "Passage Authority is the path for a bank or credit union to review a power-of-attorney ask, decide, and keep one current receipt.",
   answer:
   "Passage Authority is a guided path for the ask, the papers, your review, your decision, and a shared receipt that stays current when things change later. It does not create a power of attorney, move money, or give account access.",
   published: "2026-09-16",
   updated: "2026-09-16",
   readingTime: "5 minute read",
   category: "Plain-English guide",
   sections: [
   {
   heading: "The decision still needs a clear home",
   paragraphs: [
   "When someone asks to act for an account holder, your team still has to decide.",
   "That ask often lands in email, tickets, and folders. People redo the same questions. Staff rebuild \"where are we?\" by hand. The papers arrive. The decision still needs a clear home.",
   "Passage Authority is that home: a guided path for the ask, the papers, your review, your decision, and a shared receipt that stays current when things change later.",
   ],
   },
   {
   heading: "What you see in one place",
   paragraphs: [
   "For a request in flight, your team should be able to answer three questions without hunting:",
   ],
   points: [
   "What is the status? Where is this request right now?",
   "Who acts next? Account holder, representative, or your staff?",
   "What did we decide? Accept, limit, or refuse, and what may they do?",
   ],
   },
   {
   heading: "One receipt for everyone",
   paragraphs: [
   "After the decision, everyone sees the same receipt: the decision, what they may do, and any limits. If the answer changes later, the receipt should still show the current answer, not an old one people keep quoting from email.",
   "You still make account changes in your own systems. Passage keeps the workflow and the saved decision record.",
   ],
   },
   {
   heading: "Who this is for",
   paragraphs: [
   "Community and regional banks and credit unions, usually deposit, member, or branch operations, that get stuck on power-of-attorney requests and want one small, clear process to try.",
   "Current evaluation focus is New York, with sample people and sample papers first. That shows where work gets stuck before any separately approved use of real customer data.",
   ],
   },
   {
   heading: "What Passage does not do",
   paragraphs: [
   "Legal, identity, fraud, and account-access choices stay with the institution. Passage is the operating path and the saved decision after the papers arrive. It is not a stamp that the papers are good.",
   ],
   points: [
   "It does not create a power of attorney.",
   "It does not say a paper is legally valid.",
   "It does not notarize.",
   "It does not move money.",
   "It does not give account access.",
   "It does not replace your counsel or your policy.",
   "It is not legal advice.",
   ],
   },
   {
   heading: "Neighbors, not replacements",
   paragraphs: [
   "Some tools help someone sign or notarize a document. That is a point-in-time event.",
   "Passage keeps your decision about what to honor, and whether that decision is still current later. We are not asking you to throw those tools away.",
   ],
   },
   {
   heading: "A small way to try it",
   paragraphs: [
   "We offer a founding pilot: $5,000 for 60-90 days, for one institution, one named team, and one New York workflow. The pilot fee is credited toward year one if you continue under the pilot agreement.",
   "Sample evaluation first. Real customer data only if separately approved. We agree success measures before setup, such as time, completion, handoffs, missing-info loops, and reviewer effort.",
   ],
   },
   {
   heading: "What we do not claim yet",
   paragraphs: ["Stay accurate on this evaluation:"],
   points: [
   "Other states are not available in this evaluation.",
   "We do not claim savings numbers or badges we have not earned.",
   "Yearly price bands used in private discovery are not list prices on this page.",
   ],
   },
   {
   heading: "Bottom line",
   paragraphs: [
   "Someone asks to act for an account holder. Your team reviews the papers under your rules. You record accept, limit, or refuse. Everyone sees the same current answer.",
   "That is what Passage is.",
   "That is what it is not: a lawyer, a notary, a money mover, or a key to the account.",
   ],
   },
   ],
   questions: [
   {
   question: "Does Passage create a power of attorney?",
   answer:
   "No. Passage handles the request and the institution's saved decision after the papers arrive. Creating or interpreting a power of attorney is not what Passage does.",
   },
   {
   question: "Does Passage move money or open account access?",
   answer:
   "No. The institution keeps account-access and money-movement choices. Passage keeps the workflow and the decision record.",
   },
   {
   question: "Is this available outside New York?",
   answer:
   "This evaluation focus is New York, with sample people and sample papers first. Do not treat other states as available in this evaluation.",
   },
   ],
   sources: [
   {
   label: "Passage Authority",
   href: "https://thepassageapp.io",
   },
   {
   label: "CFPB: What is a power of attorney?",
   href: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-power-of-attorney-poa-en-1149/",
   },
   ],
  },
  {
    slug: "how-a-bank-verifies-a-power-of-attorney-request",
    title: "How does a bank verify a power of attorney request?",
    description: "The bank verifies the people, reviews the legal document, confirms the requested account access, and makes its own decision. Passage keeps those steps in one clear record.",
    answer: "A bank does not rely on one checkbox or one identity result. It checks who the principal and agent are, reviews the power of attorney and any required supporting material, compares the requested actions with the document and its policy, and records whether it will accept, limit, or decline the request.",
    published: "2026-09-04",
    updated: "2026-09-04",
    readingTime: "5 minute read",
    category: "Identity and review",
    sections: [
      {
        heading: "Identity and authority are two different questions",
        paragraphs: [
          "Identity asks whether the person completing a step is who they claim to be. Authority asks whether the legal document gives that person the power they are requesting. A strong process answers both questions separately.",
          "Passage is designed to collect the institution's chosen identity evidence and keep it beside the request. Passage does not declare that a person is legally authorized; the institution keeps that decision.",
        ],
      },
      {
        heading: "What the institution can check",
        paragraphs: ["The exact checklist varies by institution, account, document, and applicable law. A typical review may include:"],
        points: [
          "Identity information for the account holder and the proposed representative",
          "The power of attorney document, signatures, acknowledgments, and dates",
          "Whether the document appears current or has been revoked or replaced",
          "The accounts and actions the representative is asking to use",
          "An agent certification, legal opinion, or other material when the institution is permitted to request it",
        ],
      },
      {
        heading: "What Passage contributes",
        paragraphs: [
          "Passage gives the account holder, representative, and reviewer separate secure steps. The current evaluation workflow uses a controlled evidence checklist. Passage shows what is missing, records what was reviewed, and preserves the institution's final decision and its limits.",
          "That makes the process easier to explain without pretending that software replaced the bank's legal, fraud, or compliance review.",
        ],
      },
    ],
    questions: [
      { question: "Does Passage perform identity verification itself?", answer: "Passage coordinates the verification steps selected by the institution and stores their results. The institution decides which checks are required and whether the evidence is sufficient." },
      { question: "Does an identity match prove a power of attorney is valid?", answer: "No. Identity is one part of the review. The institution must still review the document, scope, status, and any other applicable requirements." },
      { question: "Who makes the final decision?", answer: "An authorized person at the financial institution records the acceptance, limited acceptance, request for more information, or rejection." },
    ],
    sources: [
      { label: "New York General Obligations Law § 5-1504", href: "https://www.nysenate.gov/legislation/laws/GOB/5-1504" },
      { label: "CFPB: Managing someone else's money", href: "https://www.consumerfinance.gov/consumer-tools/managing-someone-elses-money/" },
    ],
  },
  {
    slug: "can-i-use-a-power-of-attorney-to-talk-to-a-bank-for-family",
    title: "Can I use a power of attorney to talk to a bank for a family member?",
    description: "Often, that is exactly what a financial power of attorney is meant to support—but the document, its scope, and the bank's review determine what the representative may actually do.",
    answer: "If your family member named you as an agent in a financial power of attorney, you can present that document to their bank and ask the bank to recognize your authority. The bank reviews the document and decides what it will allow you to discuss or do. Passage is the shared workflow for making that request and receiving the bank's answer.",
    published: "2026-09-04",
    updated: "2026-09-04",
    readingTime: "4 minute read",
    category: "Plain-English guide",
    sections: [
      {
        heading: "A simple example",
        paragraphs: [
          "Imagine your grandmother signed a financial power of attorney naming you as her agent. She wants you to receive duplicate statements and speak with her credit union about account-service questions.",
          "In Passage today, the bank or credit union starts the request. Your grandmother uses her own link to confirm the details. You use a separate link to agree to help. The institution reviews the documents and decides what it will accept.",
        ],
      },
      {
        heading: "What Passage is—and is not",
        paragraphs: [
          "Passage is not the power of attorney document, a law firm, or the bank's decision-maker. It is the place where the request moves from person to person without disappearing into branch notes, inboxes, and disconnected review queues.",
          "The narrow first use case is New York financial power of attorney for deposit-account service. Passage helps the institution receive the request, collect its required information, review it, and give everyone a clear current result.",
        ],
      },
      {
        heading: "The boundaries matter",
        paragraphs: [
          "A power of attorney is not automatically unlimited. The document may cover only certain matters, and the request may be narrower still. A clear workflow names the account relationship, requested actions, exclusions, and end date instead of reducing everything to a vague 'POA on file' status.",
        ],
      },
    ],
    questions: [
      { question: "Can my grandmother use Passage to tell her bank I am her agent?", answer: "Yes—that is the core scenario. She can confirm a request that identifies you as her proposed representative, and the bank can review and record what authority it will recognize." },
      { question: "Can I start the request for her?", answer: "Ask the bank or credit union to start it. In Passage today, the institution sends the invitation. The account holder confirms first, then the representative can continue." },
      { question: "Does Passage create a power of attorney?", answer: "No. Passage handles the request and review around an existing authority document. People should consult a qualified lawyer for advice about creating or interpreting a power of attorney." },
    ],
    sources: [
      { label: "CFPB: What is a power of attorney?", href: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-power-of-attorney-poa-en-1149/" },
      { label: "CFPB: Help for agents under a power of attorney", href: "https://files.consumerfinance.gov/f/documents/cfpb_msem_national_agents_guide.pdf" },
    ],
  },
  {
    slug: "what-a-completed-authority-request-looks-like",
    title: "What does a completed authority request look like?",
    description: "A completed request is a decision record: who was reviewed, what the institution accepted, which accounts and actions are covered, and whether that decision is still current.",
    answer: "When the review is complete, the institution records a decision—accepted, accepted with limits, or declined. Passage then creates a readable receipt showing the people, purpose, account boundary, approved actions, limits, reason, dates, and current status. It is a record of the institution's decision, not a transfer of money.",
    published: "2026-09-04",
    updated: "2026-09-04",
    readingTime: "4 minute read",
    category: "Decision receipts",
    sections: [
      {
        heading: "The transaction is the authority decision",
        paragraphs: [
          "In Passage, a transaction means one activated authority request moving through the workflow. It is not a bank payment, withdrawal, or transfer. The completed result tells the institution and both people what the institution decided about the requested authority.",
        ],
      },
      {
        heading: "What the receipt shows",
        paragraphs: ["The receipt is designed to answer the questions a person or downstream system will ask later:"],
        points: [
          "Who is the account holder and who is the representative?",
          "Which institution, account relationship, and purpose are covered?",
          "Which actions were accepted, and which limits apply?",
          "Why did the institution make this decision, and when?",
          "Is the decision current, expired, withdrawn, or revoked?",
        ],
      },
      {
        heading: "Later changes do not erase the original decision",
        paragraphs: [
          "If the authority later expires or is revoked, Passage updates the current status while preserving the earlier decision. That helps a service representative understand what can happen now and gives an auditor the history needed to explain what happened before.",
        ],
      },
    ],
    questions: [
      { question: "Does completing a Passage request move money?", answer: "No. It records what authority the institution will recognize. Any later account action still happens through the institution's normal systems and controls." },
      { question: "Do both people receive the same access?", answer: "No. Each person receives a separate secure path. The account holder acts first, representative access remains held until that step is complete, and receipts are scoped to the appropriate participant." },
      { question: "Can the institution accept only part of a request?", answer: "Yes. The institution can record a limited acceptance and state the limits beside the accepted actions." },
    ],
    sources: [
      { label: "New York General Obligations Law § 5-1504", href: "https://www.nysenate.gov/legislation/laws/GOB/5-1504" },
      { label: "CFPB: Planning for diminished capacity and illness", href: "https://www.consumerfinance.gov/consumer-tools/educator-tools/resources-for-older-adults/financial-security-as-you-age/planning-for-diminished-capacity-and-illness/" },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
