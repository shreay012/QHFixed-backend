// Default CMS content. Mirrors what was hardcoded in the frontend so first-paint
// stays visually identical until an admin overrides via PUT /api/cms/:key.

export const CMS_DEFAULTS = {
  testimonials: [
    {
      logo: '/images/client/ecom.svg',
      company: 'E-Commerce Platform',
      description:
        "A leading automotive brand that scaled its engineering and digital product teams using QuickHire's full-time tech and design experts to accelerate internal platforms and customer-facing initiatives without long hiring cycles.",
      role: 'Senior Engineering Director',
    },
    {
      logo: '/images/client/gale.svg',
      company: 'Gale Technologies',
      description:
        'A global consulting firm that leveraged QuickHire Experts to rapidly onboard experienced designers and engineers for high-priority client engagements, ensuring speed, quality, and delivery under tight timelines.',
      role: 'Partner & Managing Director',
    },
    {
      logo: '/images/client/kfintech.svg',
      company: 'KFintech Solutions',
      description:
        'A large enterprise that used QuickHire to bridge critical tech and UX skill gaps across digital transformation projects, enabling faster execution while maintaining enterprise-grade quality standards.',
      role: 'VP of Digital Transformation',
    },
    {
      logo: '/images/client/navatar.svg',
      company: 'Navatar Digital',
      description:
        'A consumer brand that partnered with QuickHire to strengthen its e-commerce, ERP, and digital experience teams, scaling full-time professionals during peak business and expansion phases.',
      role: 'Head of Digital Operations',
    },
    {
      logo: '/images/client/ninjacart.svg',
      company: 'NinjaCart',
      description:
        'A fast-growing retail brand that onboarded dedicated tech and design professionals via QuickHire to support omnichannel growth, internal tools, and performance-driven digital initiatives.',
      role: 'Chief Information Officer',
    },
  ],

  technologies: [
    { name: 'Jenkins', img: '/images/techimages/jenkin.png' },
    { name: 'Node.Js', img: '/images/techimages/node.png' },
    { name: 'React', img: '/images/techimages/react.png' },
    { name: 'Kotlin', img: '/images/techimages/kotlin.png' },
    { name: 'Flutter', img: '/images/techimages/flutter.png' },
    { name: 'Docker', img: '/images/techimages/docker.png' },
    { name: 'Magento', img: '/images/techimages/magento.png' },
    { name: 'AWS', img: '/images/techimages/aws.png' },
    { name: 'Figma', img: '/images/techimages/figma.png' },
    { name: 'Wordpress', img: '/images/techimages/wordpress.png' },
    { name: 'HTML', img: '/images/techimages/html.png' },
  ],

  features: [
    {
      title: 'No Freelancers',
      description: 'You work with only vetted, experienced tech professionals you can rely on.',
      icon: '/images/homepage/No Freelancers.svg',
    },
    {
      title: 'Full-Time Employees Working On Your Project',
      description: 'Every expert works inside QuickHire.',
      icon: '/images/homepage/Full-time Employees.svg',
    },
    {
      title: 'Expertise In 10 Minutes',
      description:
        'Get matched with the right developer, designer, QA, or tech specialist in under 10 minutes for urgent fixes and fast execution.',
      icon: '/images/homepage/Expertise in 10 Minutes.svg',
    },
    {
      title: 'Managed delivery by Technical Project Manager',
      description:
        'Get task-based support, hourly help, 4-hour or 8-hour sessions, and easily ramp up or ramp down talent across skills whenever your needs change.',
      icon: '/images/homepage/Managed Delivery.svg',
    },
    {
      title: 'Flexible working model',
      description:
        'Get task-based support, hourly help, 4-hour or 8-hour sessions, and easily ramp up or ramp down talent across skills whenever your needs change.',
      icon: '/images/homepage/Flexible Working Model.svg',
    },
    {
      title: 'AI-empowered resources',
      description: 'Every expert comes equipped with AI-powered workflows for faster, smarter problem-solving.',
      icon: '/images/homepage/aiempowered.svg',
    },
  ],

  segments: [
    { icon: '/images/about/who_we_serve4.png', title: 'Startups', description: 'Ship faster without committing to full-time hires.' },
    { icon: '/images/about/who_we_serve3.png', title: 'Product Companies', description: 'Clear sprint backlogs with developers who contribute immediately.' },
    { icon: '/images/about/who_we_serve2.png', title: 'Mid-Size Businesses', description: 'Scale technical capacity as priorities shift.' },
    { icon: '/images/about/who_we_serve1.png', title: 'Enterprises', description: 'Access niche expertise without lengthy hiring cycles.' },
  ],

  process_steps: [
    { number: 1, title: 'Booking', description: 'Choose your resource and place a booking in minutes.' },
    { number: 2, title: 'Kick-off Call', description: 'Connect with onboarded and your project manager to align on scope and execution.' },
    { number: 3, title: 'Work Starts', description: 'The expert begins work based on agreed plan.' },
    { number: 4, title: 'Get updates', description: 'Receive regular progress updates via chat or email from your project manager.' },
    { number: 5, title: 'Extend or close', description: 'Add more hours, continue with the same expert, or close project when done.' },
  ],

  faqs: [
    {
      id: 'general',
      name: 'General Information',
      items: [
        { id: 'q1', question: 'What does "Available in 10" actually mean?', answer: 'Once you place your request and complete the payment, system begins allocation instantly. Within 10 minutes, your TPM connects with you, confirms the requirement, and assigns the right expert. It removes traditional hiring wait times that typically take days or weeks.' },
        { id: 'q2', question: 'How does the instant booking process work?', answer: 'You select the skill you need, choose the number of hours, and complete the payment. The Ai-TPM system immediately starts matching your requirement. This triggers a fast allocation cycle where your TPM validates the need, checks availability, and assigns an expert — all within minutes.' },
        { id: 'q3', question: 'What is the role of TPM in the allocation process?', answer: 'The TPM provides short-term support by validating your need, checking skill fit, and assigning the right resource quickly.' },
        { id: 'q4', question: 'Do we provide resources from all IT domains?', answer: 'Yes. The platform supports almost all major IT categories — Development (Frontend, Backend, Mobile), Design, QA, DevOps, Ai Engineering, Cloud, Content, Digital Marketing, and more. New domains keep getting added based on customer needs.' },
      ],
    },
    {
      id: 'purchasing',
      name: 'Purchasing & Payment',
      items: [
        { id: 'q5', question: 'Can customers book resources for hours or days?', answer: 'Yes. You can book for as little as four hour or extend your booking to several days based on your project. The system is flexible and supports short tasks, urgent fixes, or continuous work.' },
        { id: 'q6', question: 'Can customers extend their booking anytime?', answer: 'Absolutely. If you need more hours or want to continue the work, you can extend the booking instantly from the app. The system prioritizes your active resource to maintain continuity.' },
      ],
    },
    {
      id: 'plan',
      name: 'Plan & Pricing',
      items: [
        { id: 'q7', question: 'What does "Captive Resource" mean?', answer: 'A captive resource works only on your project during the booked hours. They are not shared between clients and do not multitask across multiple assignments. You get undivided focus and dedicated output during your session.' },
      ],
    },
    { id: 'setup', name: 'Setup & Configuration', items: [] },
    {
      id: 'call',
      name: 'Call management & Features',
      items: [
        { id: 'q8', question: 'What tools are integrated inside platform?', answer: 'The app supports Live Chat, in-app messaging, email updates, and external communication tools like Teams or Zoom for meetings. Everything is built to keep your work moving without unnecessary delays.' },
        { id: 'q9', question: 'How do customers communicate with the resource or TPM?', answer: 'Once your booking is active, live chat gets activated automatically. You can chat with the TPM and the assigned resource directly, share files, clarify tasks, and track progress — all inside the app. For calls, the TPM schedules meetings based on need.' },
      ],
    },
    { id: 'integration', name: 'Integration & Compatibility', items: [] },
    { id: 'security', name: 'Security & Privacy', items: [] },
    {
      id: 'support',
      name: 'Customer Support & Resource',
      items: [
        { id: 'q10', question: 'What level of experience and skill do resources have?', answer: 'All experts on the platform are pre-vetted, experienced, and trained to work in high-speed, outcome-driven environments. They come from strong IT backgrounds with proven domain knowledge across development, design, Ai, DevOps, QA, content, and more.' },
        { id: 'q11', question: 'Are resources exclusive to one project at a time?', answer: 'Yes. Once assigned to your session, they work solely on your task. This ensures focus, consistent output, and no dilution of effort.' },
      ],
    },
  ],
};
