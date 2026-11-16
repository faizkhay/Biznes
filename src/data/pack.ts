// What every business sold here comes with, how a sale runs, what stays with the buyer, and the
// questions people ask. One source for the home page, the How it works page, each listing, the
// structured data and llms.txt.
//
// Source: the owner, in conversation, 16 November 2026: "i will build the brand, branding, website
// and purchase domain names, lock social media handles, have a business strategy, people who have
// the money or can undertake these businesses can just buy, i will help with incorporation".
// The six items below are that list and nothing more. Anything added later is added here.

/** What hangs on the ring: the six things every business comes with. */
export const INCLUDED = [
  {
    title: "The name and the identity",
    line: "A name chosen for the business, with its logo, colours and typefaces, ready to print and to post.",
  },
  {
    title: "The domain name",
    line: "The web address that matches the name, bought and passed to you.",
  },
  {
    title: "The social media names",
    line: "Matching names on the main platforms, secured for the brand.",
  },
  {
    title: "The website",
    line: "Designed and built by Khay Digital for this one business, and yours in full once you have paid.",
  },
  {
    title: "The business strategy",
    line: "A written plan for opening and growing: who it is for, how it earns, and what to do first.",
  },
  {
    title: "Help with incorporation",
    line: "We help you set up the company that will own the business.",
  },
] as const;

/** The sale, in the order the buyer lives it. */
export const STEPS = [
  {
    title: "Choose",
    line: "Look through the businesses. Each page shows the brand, what comes with it, what you would bring and the price.",
  },
  {
    title: "Reserve",
    line: "Tell us which one. We meet, go through the brand and the strategy with you, and answer what you ask.",
  },
  {
    title: "Take it over",
    line: "Once you have paid, the name, the domain, the website and the strategy pass to you, and we help you set up the company.",
  },
  {
    title: "Open",
    line: "The business is yours to run. Khay Digital can keep the website looked after with a care plan.",
  },
] as const;

/** The honest half: what no brand can supply. Said on the home page and on How it works. */
export const YOURS = {
  heading: "A brand is not a business until someone runs it",
  line: "We prepare everything up to the door. What happens behind it is yours, and we make no promise of income.",
  ours: ["The name and the identity", "The domain and the social media names", "The website", "The strategy", "Help with incorporation"],
  yours: ["Premises, and the lease", "Licences and permits", "Equipment and stock", "The team", "The work, every day"],
} as const;

/** The tagline moment. Written by Khay Digital from the offer; to confirm with the owner. */
export const TAGLINE = "The business is ready\nAll it needs is its owner";

/** The questions, as plain question and answer. Also the page's FAQPage data. */
export const FAQS = [
  {
    q: "What exactly do I get?",
    a: "The name and the identity, the domain name, the social media names, the website, the business strategy, and help with incorporation. Each business's own page lists them again beside what you would bring.",
  },
  {
    q: "Is each business sold only once?",
    a: "Yes. Each business has one owner. Once it is sold, it leaves the list.",
  },
  {
    q: "Does the price include premises, equipment or stock?",
    a: "No. The price covers the brand, the domain, the website, the strategy and our help with incorporation. Premises, licences, equipment, stock and staff are yours to arrange, and each page says so.",
  },
  {
    q: "Do you promise the business will make money?",
    a: "No. We can promise that the brand is finished and the strategy is written. How the business does depends on how it is run.",
  },
  {
    q: "Can I change the name or the look after I buy?",
    a: "Yes. Once you have paid, the brand is yours in full, to keep or to change.",
  },
  {
    q: "Can you build a business around my own idea?",
    a: "Yes. Building brands and websites for other people's ideas is Khay Digital's everyday work. Send a request and tell us about it.",
  },
] as const;
