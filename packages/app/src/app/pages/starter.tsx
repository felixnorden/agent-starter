import type { ReactNode } from "react";

/**
 * The starter's landing page. A server component: it renders once, ships no
 * client JavaScript, and reads nothing from the request.
 *
 * Hallmark · genre: editorial · macrostructure: Marquee Hero · theme: Garden
 * nav: N1a wordmark + 2 links · footer: Ft1 mast-headed · enrichment: none
 * tokens: src/app/styles.css
 */

const Mono = ({ children }: { children: ReactNode }) => (
  <code className="font-mono text-[0.85em] text-foreground">{children}</code>
);

const packages = [
  {
    path: "packages/app",
    role: (
      <>
        RedwoodSDK Worker. Serves the HTML and forwards chat over <Mono>env.AGENT_APP</Mono>.
      </>
    ),
  },
  {
    path: "packages/agents",
    role: (
      <>
        Flue Worker. Owns each conversation as a <Mono>Durable Object</Mono>.
      </>
    ),
  },
];

const commands = [
  {
    term: "pnpm dev",
    does: "Start both Workers. App on 5173, agents on 5174.",
  },
  {
    term: "pnpm gen",
    does: (
      <>
        Rewrite <Mono>worker-configuration.d.ts</Mono> after a <Mono>wrangler.jsonc</Mono> change.
      </>
    ),
  },
  {
    term: "pnpm build",
    does: (
      <>
        Build both Workers into <Mono>packages/*/dist</Mono>.
      </>
    ),
  },
  {
    term: "pnpm check",
    does: "Typecheck both packages.",
  },
  {
    term: "pnpm deploy:agents",
    does: "Deploy the agents Worker. Run this one first.",
  },
  {
    term: "pnpm deploy:app",
    does: "Deploy the app Worker.",
  },
  {
    term: "pnpm clean",
    does: "Remove dist, .turbo, and the Vite cache.",
  },
];

const docs = [
  {
    label: "RedwoodSDK docs",
    href: "https://docs.rwsdk.com",
    note: "The app framework. Requests, server components, middleware.",
  },
  {
    label: "Flue docs",
    href: "https://flueframework.com",
    note: "The agent runtime. Model selection and conversation state.",
  },
  {
    label: "Workers docs",
    href: "https://developers.cloudflare.com/workers/",
    note: "The runtime both Workers use. Bindings and env.",
  },
  {
    label: "Durable Objects docs",
    href: "https://developers.cloudflare.com/durable-objects/",
    note: "Where conversation state lives. One object per conversation.",
  },
];

const request = `curl -X POST http://localhost:5173/api/agent/demo-1 \\
  -H 'content-type: application/json' \\
  -d '{"message":"Tell me a joke."}'`;

const cliRun =
  'pnpm --filter ./packages/agents exec flue run src/agents/assistant.ts --message "Hi"';

const Row = ({ term, children }: { term: string; children: ReactNode }) => (
  <div className="grid gap-1 border-t border-border py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
    <dt className="font-mono text-sm text-foreground">{term}</dt>
    <dd className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">{children}</dd>
  </div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="min-w-0">
    <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
      {title}
    </h2>
    <div className="mt-5">{children}</div>
  </section>
);

const linkClass =
  "text-brand underline decoration-brand/35 underline-offset-4 transition-colors duration-150 ease-out hover:decoration-brand active:text-foreground";

const navLinkClass = "text-foreground transition-colors duration-150 ease-out hover:text-brand";

const preClass =
  "mt-4 max-w-full overflow-x-auto rounded-md bg-code px-5 py-4 font-mono text-sm leading-relaxed text-code-foreground";

export const Starter = () => {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-6 sm:px-10">
        <span className="font-serif text-base font-semibold tracking-tight">Agent Starter App</span>
        <nav aria-label="Primary" className="flex items-center gap-6 text-sm font-medium">
          <a href="https://docs.rwsdk.com" className={navLinkClass}>
            Docs ↗
          </a>
          <a href="https://flueframework.com" className={navLinkClass}>
            Flue ↗
          </a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex min-h-[58svh] w-full max-w-5xl flex-col justify-end px-6 pt-10 pb-8 sm:px-10">
          <h1 className="font-serif text-[clamp(3.25rem,13vw,11rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
            Agent
            <br />
            Starter App
          </h1>
        </section>

        <div aria-hidden="true" className="h-[3px] w-full bg-brand" />

        <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
          <div className="grid gap-14 pt-14 pb-20">
            <p className="max-w-[62ch] min-w-0 text-lg leading-relaxed text-foreground">
              A RedwoodSDK Worker serves the HTML. A Flue Worker owns each conversation as a Durable
              Object. A service binding joins them, so no public URL sits between.
            </p>

            <Section title="Packages">
              <dl>
                {packages.map((pkg) => (
                  <Row key={pkg.path} term={pkg.path}>
                    {pkg.role}
                  </Row>
                ))}
              </dl>
            </Section>

            <Section title="Commands">
              <dl>
                {commands.map((command) => (
                  <Row key={command.term} term={command.term}>
                    {command.does}
                  </Row>
                ))}
              </dl>
              <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                <Mono>pnpm dev</Mono> needs a Cloudflare account for the default Workers AI model. A
                keyed provider in <Mono>packages/agents/.env</Mono> needs no account.
              </p>
              <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                Run one agent with no server:
              </p>
              <pre className={preClass}>
                <code>
                  <span className="text-code-accent">$ </span>
                  {cliRun}
                </code>
              </pre>
            </Section>

            <Section title="Talk to the agent">
              <p className="max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                The app forwards chat over <Mono>env.AGENT_APP</Mono>. Reuse one conversation id to
                continue a conversation. A new id starts an agent with empty history.
              </p>
              <pre className={preClass}>
                <code>
                  <span className="text-code-accent">$ </span>
                  {request}
                </code>
              </pre>
              <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                <Mono>send()</Mono> returns an admission, not the reply. Call{" "}
                <Mono>read(admission)</Mono> to wait for the settlement, or <Mono>history()</Mono>{" "}
                for the snapshot.
              </p>
            </Section>

            <Section title="Docs">
              <ul>
                {docs.map((doc) => (
                  <li
                    key={doc.href}
                    className="grid gap-1 border-t border-border py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8"
                  >
                    <a href={doc.href} className={`font-mono text-sm ${linkClass}`}>
                      {doc.label} ↗
                    </a>
                    <span className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
                      {doc.note}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-12 sm:px-10">
        <div className="grid gap-3 border-t border-border pt-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
          <p className="font-serif text-sm font-semibold tracking-tight">Agent Starter App</p>
          <div>
            <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
              Local conversation state lives in <Mono>packages/agents/.wrangler/state</Mono>. Delete
              it to reset conversations.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
              <a href="https://docs.rwsdk.com" className={linkClass}>
                RedwoodSDK docs
              </a>
              <a href="https://flueframework.com" className={linkClass}>
                Flue docs
              </a>
              <a href="https://developers.cloudflare.com/workers/" className={linkClass}>
                Workers docs
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
