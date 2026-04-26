"use client";
import Link from "next/link";
import { ArrowRight, Shield, Database, Key, Zap, FileText, Lock, Check } from "lucide-react";
import { GlowCard, GradientText, Logo } from "@/components/shared";
import { Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui";
import { motion } from "framer-motion";

// ── Features ──────────────────────────────────────────────────────────────────
const features = [
  { icon: Zap, title: "Natural Language Queries", desc: "Ask in plain English — DBTalk translates to SQL or MongoDB queries automatically.", color: "text-indigo-400" },
  { icon: Database, title: "Multi-Database Support", desc: "MongoDB, PostgreSQL, MySQL — all in one place. Switch between databases instantly.", color: "text-emerald-400" },
  { icon: Key, title: "Scoped API Keys", desc: "Create read-only or read-write keys with per-key rate limits and instant revocation.", color: "text-violet-400" },
  { icon: Shield, title: "MCP Protocol", desc: "Works with Claude Desktop, your own LLM apps, or our built-in AI chatbot.", color: "text-amber-400" },
  { icon: FileText, title: "Audit Logs", desc: "Every query is logged. Know exactly who queried what, when, and how fast.", color: "text-rose-400" },
  { icon: Lock, title: "Read-Only Safety", desc: "Queries are read-only by default. Writes require explicit confirmation and write scope.", color: "text-cyan-400" },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          Everything you need to<br /><GradientText>query smarter</GradientText>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Built for developers who want database access without the friction.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <GlowCard>
              <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── HowItWorks ────────────────────────────────────────────────────────────────
const steps = [
  { n: "01", title: "Connect your database", desc: "Add your MongoDB, PostgreSQL, or MySQL credentials. We encrypt them with AES-256-GCM." },
  { n: "02", title: "Generate an API key", desc: "Create scoped API keys to authenticate with our MCP server. One-time reveal, stored securely." },
  { n: "03", title: "Choose your integration", desc: "Use Claude Desktop, our built-in chatbot, or point any MCP-compatible LLM at our endpoint." },
  { n: "04", title: "Ask in plain English", desc: "Type natural language queries. Get structured results, tables, and explanations instantly." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          From zero to querying<br /><GradientText>in 5 minutes</GradientText>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Connector line */}
        <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-500/20 via-violet-500/40 to-indigo-500/20" />
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-2xl font-bold gradient-text mb-4 z-10">
              {step.n}
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── DatabaseLogos Marquee ─────────────────────────────────────────────────────
const techStack = [
  "MongoDB", "PostgreSQL", "MySQL", "Claude AI", "Groq", "Llama 3.3",
  "Vercel", "Neon DB", "Railway", "Supabase", "Redis", "TypeScript",
];

export function DatabaseLogos() {
  return (
    <section className="py-16 overflow-hidden border-y border-border">
      <p className="text-center text-sm text-muted-foreground mb-8">Works with your stack</p>
      <div className="relative">
        <div className="flex gap-6 animate-marquee whitespace-nowrap w-max">
          {[...techStack, ...techStack].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-indigo-400/60" />{t}
            </span>
          ))}
        </div>
        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect to get started",
    features: ["1 database connection", "100 queries/day", "1 API key", "Community support", "Basic audit logs"],
    cta: "Get started",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    desc: "For serious developers",
    features: ["5 database connections", "Unlimited queries", "10 API keys", "Priority support", "Full audit logs", "Analytics dashboard"],
    cta: "Start free trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    desc: "For growing teams",
    features: ["Unlimited connections", "Unlimited queries", "Unlimited API keys", "SSO / SAML", "Custom domain", "SLA guarantee"],
    cta: "Contact us",
    href: "/sign-up",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          Simple, <GradientText>transparent pricing</GradientText>
        </h2>
        <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 flex flex-col ${
              plan.highlight
                ? "border-2 border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10"
                : "border border-border bg-card"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium">
                Most popular
              </div>
            )}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</p>
              <p className="text-4xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground">{plan.desc}</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={plan.href}>
              <Button variant={plan.highlight ? "default" : "outline"} className="w-full">
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
const testimonials = [
  { name: "Alex Chen", role: "Backend Engineer", company: "Fintech startup", quote: "DBTalk completely changed how I explore production data. I just ask questions in Slack and get answers." },
  { name: "Sarah Kim", role: "Data Analyst", company: "E-commerce SaaS", quote: "No more bugging developers for SQL. I can query our Postgres database myself with plain English." },
  { name: "Marcus Johnson", role: "CTO", company: "B2B platform", quote: "We connected it to Claude Desktop in minutes. Our whole team uses it for ad-hoc database queries now." },
  { name: "Priya Patel", role: "Full Stack Developer", company: "Agency", quote: "The MCP integration is seamless. MongoDB queries that used to take me 20 minutes take 20 seconds." },
  { name: "Tom Rodriguez", role: "DevOps Lead", company: "SaaS startup", quote: "The audit logs are a lifesaver for compliance. I can see exactly what queries ran and when." },
  { name: "Li Wei", role: "Product Manager", company: "Analytics firm", quote: "I'm not technical but I use DBTalk daily. It's democratized database access across our whole company." },
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by <GradientText>developers</GradientText></h2>
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="break-inside-avoid rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} className="w-9 h-9 rounded-full bg-muted" />
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const faqs = [
  { q: "How does DBTalk connect to my database?", a: "You provide your host, port, database name, and credentials. We encrypt them with AES-256-GCM and store only the ciphertext. Your credentials are decrypted in memory only when a query runs." },
  { q: "Is my database connection string stored securely?", a: "Yes. Credentials are encrypted using AES-256-GCM with a server-side encryption key. The raw credentials are never logged or exposed." },
  { q: "Can DBTalk modify my data?", a: "By default, only SELECT queries are allowed. To enable writes, you must explicitly create an API key with write scope and use our transaction confirmation flow." },
  { q: "What LLMs does the chatbot use?", a: "Our built-in chatbot uses Groq with Llama 3.3 70B for fast, accurate responses. The MCP endpoint works with any compatible LLM including Claude, GPT-4, and more." },
  { q: "How does MCP work with Claude Desktop?", a: "Download our config file from your dashboard, drop it into Claude Desktop's config folder, and Claude gains access to your database as a native tool." },
  { q: "What databases are supported?", a: "Currently MongoDB, PostgreSQL, and MySQL. More databases are on our roadmap." },
  { q: "How are API keys scoped?", a: "Each key can have read or write scopes, a custom rate limit, and a label. You can create multiple keys for different integrations and revoke any key instantly." },
  { q: "What happens if I hit my rate limit?", a: "Requests over your limit receive a 429 response. Rate limits reset every minute. Upgrade to Pro or Team for higher limits." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently asked <GradientText>questions</GradientText></h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
export function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Ready to query smarter?</h2>
        <p className="text-indigo-100 text-lg mb-8">Join 2,000+ developers already using DBTalk.</p>
        <Link href="/sign-up">
          <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-xl gap-2">
            Get started for free <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Developers: ["Documentation", "API Reference", "MCP Protocol", "SDKs"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-3" />
            <p className="text-sm text-muted-foreground">Talk to your databases in plain English.</p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{section}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">© 2026 DBTalk. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
