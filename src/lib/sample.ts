import type { PageRef, SiteConfig, TemplateId } from "./types";
import { isBuiltInPage, isTextAlign, type CustomPage } from "./types";
import { templateMeta, isTemplateId } from "./templates";

/** Default (restaurant) is the first template — works for far more than restaurants. */
export function createSampleSite(): SiteConfig {
  return createSite("restaurant");
}

/** Build a fully-populated site from a template id. */
export function createSite(template: TemplateId): SiteConfig {
  switch (template) {
    case "portfolio":
      return createPortfolio();
    case "profile":
      return createProfile();
    case "business":
      return createBusiness();
    case "modern":
      return createModern();
    case "clinic":
      return createClinic();
    case "bank":
      return createBank();
    case "shop":
      return createShop();
    case "films":
      return createFilms();
    case "hr":
      return createHr();
    case "agency":
      return createAgency();
    case "newsroom":
      return createNewsroom();
    case "dashboard":
      return createDashboard();
    default:
      return createRestaurant();
  }
}

function baseConfig(template: TemplateId): SiteConfig {
  const meta = templateMeta(template);
  return {
    template,
    siteName: "",
    tagline: "",
    palette: meta.defaultPalette,
    pages: meta.defaultPages,
    customPages: [],
    align: { hero: meta.heroAlign },
    hero: { heading: "", subtext: "" },
    about: { text: "" },
    menu: [],
    projects: [],
    services: [],
    team: [],
    jobs: [],
    contact: { phone: "", email: "", address: "", whatsapp: "", mapsQuery: "" },
    hours: "",
    features: { ...meta.features },
    social: { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "", tiktok: "" },
    images: { heroBg: "", about: "" },
    colors: { headerBg: "", headerText: "", footerBg: "", footerText: "" },
    buttons: { primaryLabel: "", primaryColor: "" },
  };
}

function createRestaurant(): SiteConfig {
  const site = baseConfig("restaurant");
  site.siteName = "La Trattoria";
  site.tagline = "Honest Italian cooking in the heart of town — fresh, every day.";
  site.hero = {
    heading: "La Trattoria",
    subtext:
      "Wood-fired pizzas, fresh pasta and slow Sunday sauce — served with a smile since 1989.",
  };
  site.about = {
    text:
      "La Trattoria started as a tiny family kitchen and grew into the neighbourhood spot people drive across town for.\n\nEverything on the menu is made from scratch: pasta rolled each morning, sauces simmered low and slow, and dough proofed for 48 hours before it hits the wood-fired oven. No shortcuts, no freezers — just honest cooking.",
  };
  site.menu = [
    { id: "m1", name: "Margherita", description: "San Marzano tomato, fior di latte, fresh basil, olive oil.", price: "12.50", image: "" },
    { id: "m2", name: "Truffle Tagliatelle", description: "Hand-rolled egg pasta, wild mushrooms, black truffle cream.", price: "17.00", image: "" },
    { id: "m3", name: "Burrata & Prosciutto", description: "Creamy burrata, 24-month prosciutto, rocket, aged balsamic.", price: "14.50", image: "" },
    { id: "m4", name: "Slow Sunday Ragu", description: "Beef and pork ragu braised for six hours, served over pappardelle.", price: "18.00", image: "" },
    { id: "m5", name: "Tiramisu", description: "Espresso-soaked savoiardi, mascarpone cream, cocoa dust.", price: "7.50", image: "" },
    { id: "m6", name: "Affogato", description: "Vanilla gelato drowned in a double shot of our house espresso.", price: "6.00", image: "" },
  ];
  site.contact = {
    phone: "+1 (555) 214-8890",
    email: "ciao@latrattoria.example",
    address: "48 Union Street, Springfield",
    whatsapp: "+1 555 214 8890",
    mapsQuery: "",
  };
  site.hours = "Mon – Fri  11:00 – 22:00\nSat  12:00 – 23:00\nSun  12:00 – 21:00";
  return site;
}

function createPortfolio(): SiteConfig {
  const site = baseConfig("portfolio");
  site.siteName = "Maya Chen";
  site.tagline = "Freelance product designer — approachable, human software since 2016.";
  site.hero = {
    heading: "Maya Chen",
    subtext: "I design digital products people actually enjoy using. Currently taking on select projects.",
  };
  site.about = {
    text:
      "I’m a product designer based between London and Lisbon, with 10 years of experience across fintech, health and creative tools.\n\nI help small teams do big things: research, interface design, prototyping and design systems — always shipped as real, usable code.",
  };
  site.projects = [
    { id: "p1", title: "Pocket Ledger", description: "A personal finance app rated 4.8★ — designed end-to-end in 8 weeks.", image: "", link: "" },
    { id: "p2", title: "Bloom Health", description: "Design system and pharmacist flow for a telehealth startup.", image: "", link: "" },
    { id: "p3", title: "Canvas Notes", description: "A calm, keyboard-first note-taking app for Mac and iPad.", image: "", link: "" },
  ];
  site.contact = {
    phone: "+44 7700 900123",
    email: "hello@mayachen.studio",
    address: "",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createProfile(): SiteConfig {
  const site = baseConfig("profile");
  site.siteName = "Ava Lindqvist";
  site.tagline = "Brand & web consultant — honest strategy, sharp design, calm delivery.";
  site.hero = {
    heading: "Ava Lindqvist",
    subtext:
      "I help founders and small teams look like the real deal online — brand, website, and the words to go with them.",
  };
  site.about = {
    text:
      "For 12 years I’ve been the design partner people call when they’re about to launch something and it has to be right.\n\nI’ve shaped brands for a regional bank, an HR tech startup and a film production shop. Every project gets one senior person — me — and a process that starts with your customers, not your logo.",
  };
  site.services = [
    { id: "s1", title: "Brand identity", description: "Name, logo, tone of voice and a small system you can actually use.", icon: "🧭" },
    { id: "s2", title: "Website design", description: "A site that sells — strategy, copy, design and a build you can edit.", icon: "💻" },
    { id: "s3", title: "Content & copy", description: "Web copy, case studies and pitch decks that read like a human wrote them.", icon: "✍️" },
    { id: "s4", title: "Workshops & mentoring", description: "Half-day brand sprints and honest advice for in-house teams.", icon: "🎓" },
  ];
  site.contact = {
    phone: "+46 70 123 45 67",
    email: "hello@avalindqvist.se",
    address: "Stockholm, Sweden",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createBusiness(): SiteConfig {
  const site = baseConfig("business");
  site.siteName = "Corner Barbers";
  site.tagline = "Sharp cuts, honest prices — walk-ins welcome, appointments preferred.";
  site.hero = {
    heading: "Corner Barbers",
    subtext:
      "Classic barbering done properly: hot-towel shaves, skin fades and beard sculpting since 2011.",
  };
  site.about = {
    text:
      "Corner Barbers is a family-run shop with three chairs and a ten-year waiting list for weekend slots — just kidding, we always squeeze you in.\n\nEvery cut finishes with a hot towel and a chat. That’s the deal.",
  };
  site.services = [
    { id: "s1", icon: "💈", title: "Classic cut", description: "Scissors or clippers, washed and styled. 30 minutes." },
    { id: "s2", icon: "🪒", title: "Hot-towel shave", description: "Traditional straight-razor shave with pre-lather treatment." },
    { id: "s3", icon: "🧔", title: "Beard sculpting", description: "Shape, line-up and conditioning oil. 20 minutes." },
    { id: "s4", icon: "🧒", title: "Kids' cut", description: "For under 12s. Extra patience included, free of charge." },
  ];
  site.contact = {
    phone: "+1 (555) 402-1177",
    email: "hello@cornerbarbers.example",
    address: "12 Elm Street, Springfield",
    whatsapp: "+1 555 402 1177",
    mapsQuery: "",
  };
  site.hours = "Tue – Fri  9:00 – 19:00\nSat  8:00 – 17:00\nSun – Mon  Closed";
  return site;
}

function createModern(): SiteConfig {
  const site = baseConfig("modern");
  site.siteName = "Lumen Studio";
  site.tagline = "A creative studio for brands that want to be seen — design, motion and web, under one roof.";
  site.hero = {
    heading: "We make brands impossible to ignore.",
    subtext:
      "Lumen is a small design studio with a big appetite — strategy, identity and websites for teams that care about the details.",
  };
  site.about = {
    text:
      "Lumen Studio began with two designers, one borrowed camera and a stubborn belief that small teams can do world-class work.\n\nToday we're a crew of twelve across design, motion and code — shipping brands, campaigns and websites for clients in twelve countries. No layers of management, no bloated process. Just sharp ideas, made beautifully.",
  };
  site.services = [
    { id: "s1", icon: "🧭", title: "Brand strategy", description: "Positioning, naming and the story that makes you different." },
    { id: "s2", icon: "🖌️", title: "Identity design", description: "Logos, type and colour systems that work everywhere." },
    { id: "s3", icon: "🎬", title: "Motion & 3D", description: "Product films, launch reels and interactive 3D moments." },
    { id: "s4", icon: "🌐", title: "Websites", description: "Fast, accessible sites that turn attention into action." },
  ];
  site.contact = {
    phone: "+1 (555) 880-4421",
    email: "hello@lumen.studio",
    address: "20 Foundry Lane, Newtown",
    whatsapp: "",
    mapsQuery: "",
  };
  site.team = [
    { id: "t1", name: "Mara Voss", role: "Creative Director", bio: "Fifteen years turning vague briefs into award-winning brands." },
    { id: "t2", name: "Daniel Okoye", role: "Motion Designer", bio: "Loves a good product film and a very tight deadline." },
    { id: "t3", name: "Aiko Tanaka", role: "Brand Strategist", bio: "Asks the questions nobody else dares to ask." },
    { id: "t4", name: "Sofia Marin", role: "Engineer", bio: "Builds the fast, accessible websites the rest of us brag about." },
  ];
  return site;
}

function createClinic(): SiteConfig {
  const site = baseConfig("clinic");
  site.siteName = "Harbor Health";
  site.tagline = "Family care, specialists and emergency medicine — all under one roof.";
  site.hero = {
    heading: "Good health, made simple.",
    subtext:
      "Harbor Health brings family doctors, specialists and a hospital-grade lab together — so your care never bounces you between buildings.",
  };
  site.about = {
    text:
      "Harbor Health opened in 2008 with a simple promise: you should be able to see your family doctor, get your bloods done and see a specialist without being sent across the city.\n\nToday we're a team of 200 clinicians across twelve departments, with a 24/7 emergency unit and an on-site pharmacy. Whether it's a yearly check-up or something more serious, we're here — early, often and without the runaround.",
  };
  site.services = [
    { id: "d1", icon: "🫀", title: "Cardiology", description: "ECG, echocardiograms and heart-health checks with rapid results." },
    { id: "d2", icon: "🧸", title: "Pediatrics", description: "Gentle care for little ones, from newborn checks to teen health." },
    { id: "d3", icon: "🦴", title: "Orthopedics", description: "Sports injuries, joint pain and physio in one convenient visit." },
    { id: "d4", icon: "👩‍⚕️", title: "Women's health", description: "Screenings, prenatal care and menopause support — no judgment." },
    { id: "d5", icon: "🔬", title: "Laboratory", description: "On-site lab with same-day results for most routine tests." },
    { id: "d6", icon: "💊", title: "Pharmacy", description: "Scripts filled while you wait, with friendly advice on the side." },
  ];
  site.team = [
    { id: "t1", name: "Dr. Amina Okafor", role: "Cardiology · 15 yrs", bio: "Focused on preventive heart care and catching problems early." },
    { id: "t2", name: "Dr. Peter Lindqvist", role: "Pediatrics · 12 yrs", bio: "Kids love him, parents trust him. Speaks three languages." },
    { id: "t3", name: "Dr. Rosa Delgado", role: "Orthopedics · 18 yrs", bio: "Got you back on the field — knees, shoulders and everything between." },
    { id: "t4", name: "Dr. Sam Whitfield", role: "Lead Pathologist", bio: "Runs our lab and makes sure results are never a guessing game." },
  ];
  site.contact = {
    phone: "+1 (555) 227-1100",
    email: "care@harborhealth.example",
    address: "12 Wellness Avenue, Lakeside",
    whatsapp: "+1 555 227 1100",
    mapsQuery: "",
  };
  site.hours = "Mon – Fri  8:00 – 20:00\nSat  9:00 – 17:00\nSun  10:00 – 14:00\nER open 24/7, every day";
  return site;
}

function createBank(): SiteConfig {
  const site = baseConfig("bank");
  site.siteName = "Northbridge Bank";
  site.tagline = "Straightforward banking — transparent fees, honest rates, humans when you need them.";
  site.hero = {
    heading: "Banking that tells you the truth.",
    subtext:
      "No hidden fees, no fine-print surprises. Open an account in ten minutes, manage everything from the app, and reach a real person in under a minute.",
  };
  site.about = {
    text:
      "Northbridge was founded by two ex-bankers who were tired of watching customers get stung by confusing terms.\n\nWe publish every fee, every rate and every deadline on our site — no asterisks. Two million customers and a 4.7-star app rating later, the mission hasn't changed: make serious banking feel boringly simple.",
  };
  site.menu = [
    { id: "a1", name: "Everyday Checking", description: "No monthly fee, free ATM network, direct deposit one day early.", price: "$0 / mo", image: "" },
    { id: "a2", name: "High-Yield Saver", description: "Competitive rate on every dollar, no minimum balance.", price: "3.10% AER", image: "" },
    { id: "a3", name: "Cashback Card", description: "1.5% cash back everywhere, 0% on purchases for 12 months.", price: "1.5% back", image: "" },
    { id: "a4", name: "Fixed Saver", description: "Lock in a higher rate for 6 or 12 months with easy early access.", price: "4.20% AER", image: "" },
    { id: "a5", name: "ISA", description: "Tax-free savings with flexible withdrawals, no penalty.", price: "4.05% AER", image: "" },
    { id: "a6", name: "Business Account", description: "Free accounting integrations, invoicing and multi-user access.", price: "$0 / mo", image: "" },
  ];
  site.contact = {
    phone: "+1 (555) 409-8822",
    email: "hello@northbridge.example",
    address: "One Market Square, Downtown",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createShop(): SiteConfig {
  const site = baseConfig("shop");
  site.siteName = "The Daily Goods";
  site.tagline = "Small-batch pantry staples, ceramics and gifts — packed with care, shipped fast.";
  site.hero = {
    heading: "Everyday things, made better.",
    subtext:
      "We work with small makers and family farms to bring you pantry staples and home goods that taste and feel like they should.",
  };
  site.about = {
    text:
      "The Daily Goods started as a market stall selling honey from a single local beekeeper.\n\nNow we stock over 300 small-batch products from 80 makers — but the rule hasn't changed: if we wouldn't put it in our own kitchen, we don't sell it. Every order is packed by hand, plastic-free, and on its way within 24 hours.",
  };
  site.menu = [
    { id: "p1", name: "Wildflower Honey", description: "Raw, unfiltered honey from a single local apiary.", price: "12.00", image: "" },
    { id: "p2", name: "Stoneware Mug", description: "Hand-thrown mug, glazed in-house — each one unique.", price: "18.00", image: "" },
    { id: "p3", name: "Single-Origin Coffee", description: "Roasted weekly. Choose whole bean or ground.", price: "14.50", image: "" },
    { id: "p4", name: "Canvas Market Tote", description: "Heavyweight organic canvas, holds a week of groceries.", price: "16.00", image: "" },
    { id: "p5", name: "Sourdough Starter Kit", description: "Live starter, jar and instructions — bread by Saturday.", price: "24.00", image: "" },
    { id: "p6", name: "Olive Oil, Cold-Pressed", description: "Single-estate, harvested this season in Greece.", price: "19.00", image: "" },
  ];
  site.contact = {
    phone: "+1 (555) 771-2040",
    email: "hi@thedailygoods.example",
    address: "9 Market Row, Old Town",
    whatsapp: "+1 555 771 2040",
    mapsQuery: "",
  };
  return site;
}

function createFilms(): SiteConfig {
  const site = baseConfig("films");
  site.siteName = "Polaris Films";
  site.tagline = "Award-winning film company crafting stories for screens of every size.";
  site.hero = {
    heading: "Stories worth remembering.",
    subtext:
      "From festival shorts to brand films and documentaries — we write, shoot, cut and score stories that people actually finish watching.",
  };
  site.about = {
    text:
      "Polaris Films began in a rented edit suite with one camera and two films that wouldn't stop winning awards.\n\nFifteen years on, we're a crew of 40 across two studios — directing documentaries, commercials and features for clients in nine countries. We've never outsourced a cut, never delivered late, and never made a film we weren't proud to put our name on.",
  };
  site.projects = [
    { id: "f1", title: "The Last Lighthouse", description: "Feature documentary — a vanishing profession, filmed over three winters.", image: "", link: "" },
    { id: "f2", title: "Paper Planes", description: "Festival short about a father and daughter who fold their futures.", image: "", link: "" },
    { id: "f3", title: "River City", description: "Brand film for a city's regeneration — 9 countries, 4.2M views.", image: "", link: "" },
    { id: "f4", title: "Silent Engine", description: "Documentary series following the last of the railway engineers.", image: "", link: "" },
    { id: "f5", title: "After the Rain", description: "Commissioned short for a global charity campaign.", image: "", link: "" },
  ];
  site.team = [
    { id: "t1", name: "Marina Delacroix", role: "Director", bio: "Twelve awards; famous for getting the shot nobody thought existed." },
    { id: "t2", name: "Jonah Reyes", role: "Director of Photography", bio: "Loves natural light, hates tripods, never misses focus." },
    { id: "t3", name: "Ines Fontaine", role: "Producer", bio: "Turns chaos into schedules and schedules into delivered films." },
    { id: "t4", name: "Theo Walker", role: "Editor", bio: "The rhythm master — every cut feels like it was always there." },
  ];
  site.contact = {
    phone: "+1 (555) 630-1180",
    email: "hello@polarisfilms.example",
    address: "44 Harbour Studios, Waterfront",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createHr(): SiteConfig {
  const site = baseConfig("hr");
  site.siteName = "HireWorks";
  site.tagline = "The recruitment agency that treats candidates like people and employers like partners.";
  site.hero = {
    heading: "Right people. Right teams. Right now.",
    subtext:
      "We place the people who move companies forward — for growing teams in tech, healthcare, and the skilled trades.",
  };
  site.about = {
    text:
      "HireWorks was built on a frustration: recruitment agencies that ghost candidates and clutter inboxes with mismatches.\n\nWe keep candidate pools small and deliberately curated, we meet every employer in person, and we stay in the room long after the offer letter. Over 120 placements a year, a 4.2-star employer rating, and candidates so happy they send us their friends.",
  };
  site.jobs = [
    { id: "j1", title: "Senior Recruiter", dept: "HireWorks · Tech", location: "Hybrid · Downtown", type: "Full-time" },
    { id: "j2", title: "Registered Nurse (Med/Surg)", dept: "Partner — City General", location: "Springfield", type: "Full-time" },
    { id: "j3", title: "Product Designer", dept: "Partner — Fintech start-up", location: "Hybrid", type: "Full-time" },
    { id: "j4", title: "Electrician (Commercial)", dept: "Partner — BuildCo", location: "Field · Region-wide", type: "Contract" },
    { id: "j5", title: "Talent Operations Manager", dept: "HireWorks · Ops", location: "Remote (US)", type: "Full-time" },
    { id: "j6", title: "Customer Support Lead", dept: "Partner — SaaS scale-up", location: "Remote", type: "Part-time" },
  ];
  site.contact = {
    phone: "+1 (555) 330-4477",
    email: "team@hireworks.example",
    address: "5 Commerce Court, Uptown",
    whatsapp: "+1 555 330 4477",
    mapsQuery: "",
  };
  return site;
}

function createAgency(): SiteConfig {
  const site = baseConfig("agency");
  site.siteName = "Northlight Studio";
  site.tagline = "A design & build studio for brands that want to move faster than the market.";
  site.hero = {
    heading: "We turn brave ideas into brands people remember.",
    subtext:
      "Northlight is a twelve-person studio doing brand, web and product work for teams that care about the details.",
  };
  site.about = {
    text:
      "Northlight started in a spare room with one client, one whiteboard and a rule: ship the thing you'd want to buy yourself.\n\nFifteen years on that rule still holds. We're a crew of designers, developers and strategists who've shipped 300+ projects for clients in twelve countries — and kept most of them as repeat clients. No account-manager layers, no bloated decks. Just sharp ideas, made beautifully.",
  };
  site.services = [
    { id: "s1", icon: "🧭", title: "Brand strategy", description: "Positioning, naming and the story that makes you impossible to ignore." },
    { id: "s2", icon: "🖌️", title: "Identity design", description: "Logos, type and colour systems engineered to work everywhere." },
    { id: "s3", icon: "🌐", title: "Websites & platforms", description: "Fast, accessible sites and tools that turn attention into action." },
    { id: "s4", icon: "📣", title: "Campaigns & launches", description: "Films, social kits and launch moments that people actually share." },
  ];
  site.projects = [
    { id: "p1", title: "Vanta Energy", description: "Rebrand and website for a renewables scale-up — 3× sign-ups in one quarter.", image: "", link: "" },
    { id: "p2", title: "Kestrel OS", description: "Product site and launch campaign for a dev-tools startup.", image: "", link: "" },
    { id: "p3", title: "Harbor Health", description: "Identity and patient portal for a 200-clinician hospital group.", image: "", link: "" },
    { id: "p4", title: "Northlight Annual", description: "Our yearly print — 96 pages of work, essays and bad drawings.", image: "", link: "" },
  ];
  site.team = [
    { id: "t1", name: "Mara Voss", role: "Creative Director", bio: "Fifteen years turning vague briefs into award-winning brands." },
    { id: "t2", name: "Daniel Okoye", role: "Head of Design", bio: "Design systems, product sites and the occasional pixel-perfect grid." },
    { id: "t3", name: "Aiko Tanaka", role: "Strategist", bio: "Asks the questions nobody else dares to ask." },
    { id: "t4", name: "Sofia Marin", role: "Engineer", bio: "Builds the fast, accessible sites the rest of us brag about." },
  ];
  site.contact = {
    phone: "+1 (555) 880-4421",
    email: "hello@northlight.studio",
    address: "20 Foundry Lane, Newtown",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createNewsroom(): SiteConfig {
  const site = baseConfig("newsroom");
  site.siteName = "The Daily Ledger";
  site.tagline = "Independent journalism — city life, business and the stories behind both.";
  site.hero = {
    heading: "The news, told properly.",
    subtext:
      "The Daily Ledger is an independent newsroom covering the city's politics, business and culture — no clickbait, no paywall noise.",
  };
  site.about = {
    text:
      "The Daily Ledger was founded in 1926 as a two-page broadsheet printed on a borrowed press.\n\nAlmost a century later we still answer to one person: the reader. Our newsroom of thirty journalists covers politics, business and culture with the same rule since day one — if it isn't true, we don't print it. And we keep every story open to everyone.",
  };
  site.projects = [
    { id: "a1", title: "The Warehouse District's Second Act", description: "How a forgotten industrial block became the city's fastest-growing quarter.", image: "", link: "" },
    { id: "a2", title: "Inside the Terminal Two Standoff", description: "Three years, two lawsuits and the airport expansion nobody voted for.", image: "", link: "" },
    { id: "a3", title: "The Bakers Who Never Sleep", description: "A night shift inside the city's last coal-fired bakery.", image: "", link: "" },
    { id: "a4", title: "Water Bills, Explained", description: "Why your bill went up — and who decided it should.", image: "", link: "" },
    { id: "a5", title: "Winter of the Tram Drivers", description: "Strikes, shifts and the disputed rota that froze the network.", image: "", link: "" },
  ];
  site.contact = {
    phone: "+1 (555) 267-1900",
    email: "newsdesk@dailyledger.example",
    address: "11 Printworks Row, Old Town",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

function createDashboard(): SiteConfig {
  const site = baseConfig("dashboard");
  site.siteName = "Beacon Console";
  site.tagline = "The client portal for Beacon Analytics — reports, health checks and access in one place.";
  site.hero = {
    heading: "Everything your account needs, in one place.",
    subtext:
      "Log in to review monthly reports, check service health and manage who has access to what.",
  };
  site.about = {
    text:
      "Beacon Console is the client portal behind Beacon Analytics — the dashboard your account team references on every call.\n\nHere you'll find your monthly reports, service health indicators and team access controls. Questions about anything on this page? Your account manager responds within one business day, and the report archive goes back twelve months.",
  };
  site.menu = [
    { id: "r1", name: "Monthly Performance", description: "Traffic, conversions and spend for the last 30 days.", price: "On track", image: "" },
    { id: "r2", name: "Client Health Score", description: "Composite health rating across all active services.", price: "Healthy", image: "" },
    { id: "r3", name: "Support Summary", description: "Ticket volume, first-response time and resolutions.", price: "Review", image: "" },
    { id: "r4", name: "Uptime & Incidents", description: "Availability history and any incidents within SLA.", price: "99.98%", image: "" },
    { id: "r5", name: "Quarterly Business Review", description: "Deep-dive findings and the roadmap for next quarter.", price: "Draft", image: "" },
  ];
  site.team = [
    { id: "t1", name: "Elena Marsh", role: "Account Manager", bio: "Your main point of contact for anything on the console." },
    { id: "t2", name: "Tom Adeyemi", role: "Solutions Engineer", bio: "Owns integrations, access and technical questions." },
    { id: "t3", name: "Priya Nair", role: "Data Analyst", bio: "Writes the reports and reads far too many spreadsheets." },
  ];
  site.contact = {
    phone: "+1 (555) 918-3300",
    email: "support@beaconanalytics.example",
    address: "7 Data Square, Uptown",
    whatsapp: "",
    mapsQuery: "",
  };
  return site;
}

const EMPTY_MENU_ITEM = { id: "", name: "", description: "", price: "", image: "" };
const EMPTY_PROJECT_ITEM = { id: "", title: "", description: "", image: "", link: "" };
const EMPTY_SERVICE_ITEM = { id: "", title: "", description: "", icon: "" };
const EMPTY_TEAM_ITEM = { id: "", name: "", role: "", bio: "" };
const EMPTY_JOB_ITEM = { id: "", title: "", dept: "", location: "", type: "" };
const EMPTY_CUSTOM_PAGE = {
  id: "",
  title: "",
  content: "",
  chips: [] as string[],
  ctaLabel: "",
  ctaPage: "",
  ctaHref: "",
  align: "left" as const,
};

/**
 * Repair/backfill any saved config (including ones from older versions of the
 * builder) so it always matches the current data model. Guarantees: valid
 * template, valid palette, "home" first in pages, every nested object present,
 * every item has all its fields, and page references point at real pages.
 */
export function normalizeSite(input: unknown): SiteConfig {
  const raw = (input ?? {}) as Partial<SiteConfig>;
  const template = isTemplateId(raw.template) ? raw.template : "restaurant";
  const defaults = createSite(template);

  const customPages: CustomPage[] = Array.isArray(raw.customPages)
    ? raw.customPages.map((c) => {
        const src = (c ?? {}) as Partial<CustomPage>;
        const chips = Array.isArray(src.chips) ? (src.chips as string[]) : [];
        const id = typeof src.id === "string" && src.id.trim() ? src.id.trim() : `page-${Math.random().toString(36).slice(2, 7)}`;
        const ctaPage = typeof src.ctaPage === "string" ? src.ctaPage : "";
        const align = isTextAlign(src.align) ? src.align : "left";
        return { ...EMPTY_CUSTOM_PAGE, ...src, chips, id, ctaPage, align };
      })
    : defaults.customPages;
  const customIds = new Set(customPages.map((c) => c.id));

  const pages: PageRef[] = [];
  const seen = new Set<string>();
  for (const p of raw.pages ?? defaults.pages) {
    if (typeof p !== "string" || seen.has(p)) continue;
    if (isBuiltInPage(p) || customIds.has(p)) {
      seen.add(p);
      pages.push(p as PageRef);
    }
  }
  if (!pages.includes("home")) pages.unshift("home");

  return {
    ...defaults,
    ...raw,
    template,
    pages,
    customPages,
    hero: { ...defaults.hero, ...(raw.hero ?? {}) },
    align: { hero: isTextAlign(raw.align?.hero) ? raw.align.hero : defaults.align.hero },
    about: { ...defaults.about, ...(raw.about ?? {}) },
    contact: { ...defaults.contact, ...(raw.contact ?? {}) },
    features: { ...defaults.features, ...(raw.features ?? {}) },
    social: { ...defaults.social, ...(raw.social ?? {}) },
    images: { ...defaults.images, ...(raw.images ?? {}) },
    colors: { ...defaults.colors, ...(raw.colors ?? {}) },
    buttons: { ...defaults.buttons, ...(raw.buttons ?? {}) },
    menu: Array.isArray(raw.menu)
      ? raw.menu.map((m) => ({ ...EMPTY_MENU_ITEM, ...(m ?? {}) }))
      : defaults.menu,
    projects: Array.isArray(raw.projects)
      ? raw.projects.map((p) => ({ ...EMPTY_PROJECT_ITEM, ...(p ?? {}) }))
      : defaults.projects,
    services: Array.isArray(raw.services)
      ? raw.services.map((s) => ({ ...EMPTY_SERVICE_ITEM, ...(s ?? {}) }))
      : defaults.services,
    team: Array.isArray(raw.team)
      ? raw.team.map((t) => ({ ...EMPTY_TEAM_ITEM, ...(t ?? {}) }))
      : defaults.team,
    jobs: Array.isArray(raw.jobs)
      ? raw.jobs.map((j) => ({ ...EMPTY_JOB_ITEM, ...(j ?? {}) }))
      : defaults.jobs,
  };
}