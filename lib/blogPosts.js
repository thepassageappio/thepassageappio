export const blogPosts = [
  {
    slug: 'why-families-need-more-than-funeral-planning-after-a-death',
    title: 'Why Families Need More Than Funeral Planning After a Death',
    category: 'Family Coordination',
    date: 'May 12, 2026',
    excerpt: 'The funeral is only one part of the journey. Families also need help coordinating documents, tasks, people, providers, and next steps after the service ends.',
    audience: ['Families', 'Funeral homes', 'Care teams'],
    sections: [
      {
        heading: 'The hidden coordination problem after a death',
        body: [
          'Most people assume the hardest part of losing someone is planning the funeral. That is understandable. A funeral or memorial service is emotional, visible, and time sensitive.',
          'But for many families, the most overwhelming part begins after the service is over. Visitors go home. Flowers wilt. Then the administrative weight arrives: documents, accounts, benefits, bills, providers, passwords, relatives, and decisions that somehow become urgent when everyone is already exhausted.',
          'No family should need to become a project manager in the middle of grief. Yet that is often exactly what happens.',
        ],
      },
      {
        heading: 'Why the death-care industry is ready for better tools',
        body: [
          'The funeral profession has always been built around care, trust, and guidance. That should not change. What is changing is how families expect to communicate, organize, and make decisions.',
          'Families are not asking technology to replace human care. They are asking technology to make the surrounding process clearer. Funeral homes want efficiency without losing the personal touch. Hospice teams and care providers want smoother handoffs.',
        ],
      },
      {
        heading: 'What Passage is being built to do',
        body: [
          'Passage is a modern coordination platform designed to help families organize the practical work before, during, and after a death.',
          'The goal is not to make grief tidy. Grief is not tidy. The goal is to make the practical side less chaotic so families have more room to be human.',
          'Passage gives families one shared place for tasks, next steps, important documents, family contacts, provider communication, funeral or memorial details, account reminders, wishes, and ongoing responsibilities after the service.',
        ],
      },
      {
        heading: 'Before, during, and after',
        body: [
          'Some people are planning ahead while healthy. Some are supporting a loved one through hospice. Some are suddenly facing an unexpected death. Some are weeks or months past the funeral and still sorting through accounts, paperwork, and responsibilities.',
          'A useful platform has to support all of those moments. Before a death, planning gives the people you love fewer mysteries to solve. During the first days, calm structure helps families focus on the next right step. After the service, continuity matters because the quiet administrative chapter can last weeks or months.',
        ],
      },
      {
        heading: 'Supporting funeral homes and care providers',
        body: [
          'Passage is not only for families. It is also being built with funeral homes, hospice teams, caregivers, and care providers in mind.',
          'For funeral homes, better coordination can mean more complete family information, fewer repeated calls, clearer ownership among relatives, easier collaboration, and stronger continued support after the service.',
          'The handoff matters. Families remember whether they felt guided or abandoned.',
        ],
      },
      {
        heading: 'Technology should feel human here',
        body: [
          'Technology in death care needs a different standard. It should be calm, clear, private, and respectful. It should reduce mental load without pretending to understand grief better than people do.',
          'A modern platform in this space should help answer practical questions: what do we need to do next, who is handling this, where is that document, has someone already contacted them, and what can wait until next week?',
        ],
      },
      {
        heading: 'A more coordinated future for families',
        body: [
          'The future of death care will not be purely digital. It should not be. Families will still need funeral directors, hospice professionals, clergy, celebrants, attorneys, financial advisors, caregivers, friends, and relatives.',
          'But the coordination around that guidance can be much better. Passage is being built for the space between people, providers, documents, tasks, and decisions.',
          'Because after a death, the goal is not to make everything simple. The goal is to make the next step findable.',
        ],
      },
    ],
    faqs: [
      ['What is Passage?', 'Passage is a modern coordination platform being built to help families organize tasks, documents, contacts, plans, and next steps before, during, and after a death.'],
      ['Is Passage only for funeral planning?', 'No. Funeral planning is part of the journey, but Passage supports the broader responsibilities families face before, during, and after death.'],
      ['Who is Passage for?', 'Passage is for families navigating loss, people planning ahead, caregivers, hospice professionals, funeral homes, and other care providers who support families through major transitions.'],
      ['Does technology replace funeral directors or care providers?', 'No. Passage supports professionals by organizing the practical coordination around their human care.'],
      ['When should someone start using Passage?', 'Passage can be useful before a death for planning, during arrangements for coordination, and after the funeral or memorial for ongoing tasks and document management.'],
    ],
  },
];

export function getBlogPost(slug) {
  return blogPosts.find(post => post.slug === slug) || null;
}
