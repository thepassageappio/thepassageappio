import type { Metadata } from 'next';
import { Callout, ContentSection, PublicPage, Steps } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'Your first funeral-home conversation', description: 'A practical guide to preparing for a first funeral-home conversation.' };

export default function FirstConversationGuide() {
  return (
    <PublicPage eyebrow="Family guide" title="Your first funeral-home conversation." lead="You do not need to arrive with every answer. Bring the information you have, name what is still uncertain, and ask the funeral home to explain the next decision in plain language.">
      <ContentSection title="Before the conversation">
        <Steps items={[
          { title: 'Choose one person to take notes', body: 'This person can keep questions and answers together. They do not need to make every decision.' },
          { title: 'Gather only what you already have', body: 'Basic identifying information and any known wishes are enough to begin. Ask before sending sensitive documents.' },
          { title: 'Write down the immediate questions', body: 'Start with timing, who will be your main contact, what must happen today, and what can wait.' },
        ]} />
      </ContentSection>
      <ContentSection title="Questions worth asking" tone="soft">
        <Steps items={[
          { title: 'Who is our main contact?', body: 'Ask who owns the next step and how the family will know when it is complete.' },
          { title: 'What needs a decision now?', body: 'Ask the director to separate today’s decisions from later options so the family can focus.' },
          { title: 'What will be shared, and with whom?', body: 'Ask which information is needed, why it is needed, and who will be able to see it.' },
          { title: 'What happens if plans change?', body: 'Ask how to correct information, change a choice, or reach someone when the main contact is unavailable.' },
        ]} />
      </ContentSection>
      <Callout title="This guide is preparation, not a purchase or instruction to act.">
        <p>Reading it saves nothing and sends nothing. Your funeral director can explain the choices and requirements that apply to your situation.</p>
      </Callout>
    </PublicPage>
  );
}
