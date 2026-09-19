export type LegalDocumentId = "privacy" | "terms" | "guidelines";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const legalDocuments: Record<
  LegalDocumentId,
  { title: string; introduction: string; sections: LegalSection[] }
> = {
  privacy: {
    title: "Privacy Policy",
    introduction:
      "This explains what information Skill Swap Hub uses to run accounts, services, conversations, reviews, and reports.",
    sections: [
      {
        heading: "Information you provide",
        paragraphs: [
          "We use your name, email, account type, and profile details to create and manage your account. Student providers also submit university details and proof for verification. Providers may add skills, gig descriptions, prices, availability days, and a service cover image.",
          "When you use the platform, we store service requests, order statuses, favorites, ratings and reviews, private chat messages and attachments, notifications, and any reports or evidence you submit.",
        ],
      },
      {
        heading: "How information is used",
        paragraphs: [
          "Account details help us verify access and show the right buyer or provider dashboard. Gig and request details help people find services, agree on work, and track progress. Reviews help others assess completed exchanges. Notifications remind users about work and required reviews.",
          "Reports, responses, and supporting files are used to review a dispute and decide whether a warning, suspension, rejection, or resolution is needed.",
        ],
      },
      {
        heading: "Who can see it",
        paragraphs: [
          "Other users can see information shown on your public profile or gig, including your display name, skills, service details, and visible ratings and reviews. Keep personal contact and payment details out of public listings.",
          "Private chats and their attachments are for the people in that conversation. Admin does not routinely monitor private chats; for a report, admin reviews the information and evidence users choose to submit. Student proof and report evidence are restricted to the relevant user and authorized reviewers. A reported user may receive the report details needed to respond.",
        ],
      },
      {
        heading: "Payments and account choices",
        paragraphs: [
          "Skill Swap Hub does not process payments or bank transactions. If users agree to a paid service, they should discuss the amount, method, and any payment proof in their private platform chat. Only share necessary details with the other participant.",
          "You can update available profile settings and notification preferences in your account. You can also use the account deactivation control. Information linked to past exchanges or reports may still be needed to explain a case or maintain platform records. Contact support through the Help Center for account or privacy questions.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    introduction:
      "These rules explain how buyers and student providers use Skill Swap Hub and complete an exchange.",
    sections: [
      {
        heading: "Accounts and roles",
        paragraphs: [
          "Buyers may be students or non-students. Student providers must submit their university details and proof, and receive approval before publishing gigs or offering services. A rejected student verification does not turn the student into a non-student buyer; they can follow the resubmission process.",
          "An approved provider may also request or buy a service. Their account then has both buyer and provider access, and the rules for each role apply when they act in that role. Keep your account information accurate and do not use another person's account or proof.",
        ],
      },
      {
        heading: "Services and agreements",
        paragraphs: [
          "Providers can publish gigs with a category, description, price where relevant, a service cover image, and available days. Buyers can browse gigs, save favorites, send a direct gig request, or post a general request. A provider can accept a request and both users can follow its status in their dashboards.",
          "Before work begins, agree on the scope, delivery, changes, price, and payment method in the platform's private chat. Share designs, files, payment slips, and other proof there too. Do not move service discussions or delivery to outside messaging or contacts, because those exchanges cannot be followed through the platform's service and report flow. The platform does not collect payments, guarantee a refund, or recover a bank transfer.",
        ],
      },
      {
        heading: "Completion and required reviews",
        paragraphs: [
          "After accepting a general or direct request, the provider receives a reminder after 5 days to mark it as done if the work is finished. When the provider marks the work as done, the buyer must rate and review the provider. After the buyer's review, the provider must rate and review the buyer. The completed exchange then shows feedback from both sides.",
          "If the buyer does not review within 2 days of the work being marked done, the system sends a reminder. After 2 more days it sends a final warning, and after another 2 days without a review the account is suspended. The same reminder, warning, and suspension sequence applies to a provider who does not review the buyer after the buyer's review. These checks run on a scheduled basis, so notifications may arrive shortly after a deadline.",
        ],
      },
      {
        heading: "Reports and account actions",
        paragraphs: [
          "After an eligible completed exchange, a user can report the other participant with a category, a clear description, and supporting evidence. Admin reviews the submitted report and may warn a user, suspend an account, reject a report, or resolve it. The reported user can send a description and one supporting file in their response; while that response awaits admin review, another response cannot be submitted.",
          "A suspended account cannot use normal service access. The affected user can contact admin for help or clarification. If admin resolves the report that caused an admin suspension, that account can be restored to normal access. Users must also complete the required reviews to avoid automatic review-related suspension.",
        ],
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    introduction:
      "Use the marketplace in a way that gives both people a clear, respectful record of their exchange.",
    sections: [
      {
        heading: "Be honest about who you are and what you offer",
        paragraphs: [
          "Use your own account and genuine student proof. Describe your skills, service cover image, available days, price, and delivery honestly. Do not list work you cannot provide, use another person's image as your own, or promise a result you cannot meet.",
          "Buyers should describe a general or direct request clearly, including the work needed and any agreed changes. Providers should only accept work they can reasonably complete.",
        ],
      },
      {
        heading: "Keep the exchange in platform chat",
        paragraphs: [
          "Use private chat to agree on price, payment method, timing, deliverables, revisions, and any proof. Send work files, design drafts, payment slips, and confirmation messages in that conversation. Do not ask the other person to continue the service discussion through an external app, personal contact, or off-platform message.",
          "Only share files and personal or payment details needed for the service. Do not publish someone's private details or forward their chat, proof, or work without permission.",
        ],
      },
      {
        heading: "Respect the completion and feedback process",
        paragraphs: [
          "Providers should mark an accepted request as done when the work is finished. Buyers must then rate and review the provider, and providers must rate and review the buyer. Give truthful feedback about the actual exchange; do not threaten, pressure, or trade a review for a different outcome.",
          "The system reminds a provider about unfinished completion status after 5 days. Missing reviews bring a reminder after 2 days, a warning after another 2 days, and suspension after 2 more days. Respond to these notifications through your dashboard.",
        ],
      },
      {
        heading: "Handle problems fairly",
        paragraphs: [
          "Stay polite in chat, even during a disagreement. Avoid harassment, threats, discrimination, spam, fake evidence, and repeated unwanted messages. If something goes wrong, keep the relevant chat and file records, then use the report process after an eligible completed exchange or contact support for guidance.",
          "Describe a report accurately and submit only relevant evidence. The reported user may explain their side and submit one supporting file, then wait for admin review before sending another response. Admin can warn, suspend, reject, or resolve a report; resolving an admin suspension can restore the affected account.",
        ],
      },
    ],
  },
};
