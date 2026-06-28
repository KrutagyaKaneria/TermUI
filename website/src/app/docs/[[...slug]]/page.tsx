import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSlugs, getDocPage } from '@/lib/source'
import { getMDXComponents } from '@/components/mdx'
import { DocBreadcrumb } from '@/components/docs/DocBreadcrumb'
import { PrevNext } from '@/components/docs/PrevNext'
import { FeedbackWidget } from '@/components/docs/FeedbackWidget'

interface Props {
  params: Promise<{ slug?: string[] }>
}

export async function generateStaticParams() {
  return getAllSlugs()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!slug || slug.length === 0) {
    return {
      title: 'TermUI Docs',
      description: 'TermUI is a TypeScript framework for building terminal user interfaces. Layout engine, JSX runtime, hooks, state management, theming, animations, routing, and hot-reload dev server. No curses. No C extensions.',
    }
  }
  const mod = await getDocPage(slug)
  if (!mod) return {}
  const fm = mod.frontmatter as { title?: string; description?: string } | undefined
  const canonical = `/docs/${slug.join('/')}`
  return {
    title: fm?.title,
    description: fm?.description,
    alternates: { canonical },
    openGraph: { title: fm?.title, description: fm?.description, url: canonical, type: 'article' },
    twitter: { card: 'summary_large_image', title: fm?.title, description: fm?.description },
  }
}

const SECTIONS = [
  {
    label: 'Getting Started',
    href: '/docs/getting-started',
    desc: 'Install TermUI, run the scaffolding CLI, and build your first terminal app.',
  },
  {
    label: 'Guides',
    href: '/docs/guides/first-app',
    desc: 'Build a real project. Covers theming, routing, testing, and the Quick builder API.',
  },
  {
    label: 'API Reference',
    href: '/docs/core/overview',
    desc: 'Package-by-package reference with type signatures, parameters, and code examples.',
  },
]

const PACKAGES = [
  { name: 'core',       accent: '#00ff88', desc: 'Screen buffer, input parsing, event system, flexbox layout engine.' },
  { name: 'widgets',    accent: '#00d4ff', desc: 'Box, Text, Table, ProgressBar, Spinner, Gauge, VirtualList.' },
  { name: 'ui',         accent: '#aa66ff', desc: 'Select, Tabs, Modal, Toast, Tree, MultiSelect, CommandPalette.' },
  { name: 'jsx',        accent: '#ffaa00', desc: 'Custom JSX runtime with useState, useEffect, useRef, useContext, useAsync, and memo().' },
  { name: 'store',      accent: '#ffaa00', desc: 'Zustand-style global state. Selector-based subscriptions; only changed components re-render.' },
  { name: 'tss',        accent: '#00d4ff', desc: 'Terminal Style Sheets. CSS-like theming with variables, pseudo-classes, and hot-reload.' },
  { name: 'router',     accent: '#00ff88', desc: 'File-based screen routing with typed params, guards, and history.' },
  { name: 'motion',     accent: '#aa66ff', desc: 'Spring-physics and easing-based animations for terminal widgets.' },
  { name: 'data',       accent: '#ff4466', desc: 'Real-time system data providers: CPU, memory, disk, network, processes.' },
  { name: 'quick',      accent: '#00d4ff', desc: 'Fluent builder API. Build a full dashboard layout in ~20 lines.' },
  { name: 'testing',    accent: '#00ff88', desc: 'In-memory test renderer. render, query, fireKey, assert. No real terminal needed.' },
  { name: 'dev-server', accent: '#aa66ff', desc: 'Hot-reload dev server. File watcher restarts your app in under 200ms.' },
  { name: 'create-termui-app', accent: '#00ff88', desc: 'Project scaffolding CLI. Templates for dashboards, interactive tools, and CLI wrappers.' },
]

function DocsLanding() {
  return (
    <div className="docs-landing">
      <h1 className="docs-landing-title">TermUI Docs</h1>

      <section className="dl-section">
        <h2 className="dl-section-title">What is TermUI?</h2>
        <p className="dl-text">
          TermUI is a TypeScript framework for building terminal user interfaces.
          You get a flexbox layout engine, a JSX runtime with React-style hooks,
          global state management, theming, spring animations, file-based routing,
          and a hot-reload dev server. Pure TypeScript. No curses bindings. No C extensions.
        </p>
        <p className="dl-text">
          The framework ships as 15 packages. Each package handles one concern.
          You install only what you need. <code className="dl-code">@termuijs/core</code> gives
          you the screen buffer, layout engine, and input parser. Add <code className="dl-code">@termuijs/widgets</code> for
          Box, Text, and Table. Add <code className="dl-code">@termuijs/jsx</code> for functional components
          and hooks. Everything composes.
        </p>
      </section>

      <section className="dl-section">
        <h2 className="dl-section-title">How to use the docs</h2>
        <p className="dl-text">
          The docs are organized into three sections:
        </p>
        <ul className="dl-list">
          <li><strong>Getting Started</strong>: Step-by-step guides to install TermUI, scaffold a project, and understand the architecture.</li>
          <li><strong>Guides</strong>: Focused tutorials for specific tasks. Pick the ones relevant to your project.</li>
          <li><strong>API Reference</strong>: Technical reference for every package, organized by module.</li>
        </ul>
        <p className="dl-text">
          Use the sidebar to navigate sections, or search (<code className="dl-code">Ctrl+K</code> / <code className="dl-code">Cmd+K</code>) to find a page.
        </p>
      </section>

      <section className="dl-section">
        <h2 className="dl-section-title">Architecture</h2>
        <p className="dl-text">
          TermUI follows a five-layer dependency model. Higher layers depend on lower layers. No circular dependencies.
        </p>
        <div className="dl-arch-table">
          <div className="dl-arch-row">
            <span className="dl-arch-layer" style={{ color: '#aa66ff' }}>Tooling</span>
            <span className="dl-arch-pkgs">dev-server, testing, create-termui-app</span>
          </div>
          <div className="dl-arch-row">
            <span className="dl-arch-layer" style={{ color: '#ffaa00' }}>Application</span>
            <span className="dl-arch-pkgs">quick, data</span>
          </div>
          <div className="dl-arch-row">
            <span className="dl-arch-layer" style={{ color: '#00d4ff' }}>Feature</span>
            <span className="dl-arch-pkgs">jsx, store, router, motion, tss</span>
          </div>
          <div className="dl-arch-row">
            <span className="dl-arch-layer" style={{ color: '#00ff88' }}>Component</span>
            <span className="dl-arch-pkgs">widgets, ui</span>
          </div>
          <div className="dl-arch-row">
            <span className="dl-arch-layer" style={{ color: '#00ff88' }}>Core</span>
            <span className="dl-arch-pkgs">core</span>
          </div>
        </div>
        <p className="dl-text dl-text-sm">
          Every layer depends only on the layers below it. You never install more than you need.
        </p>
      </section>

      <section className="dl-section">
        <h2 className="dl-section-title">Pre-requisite knowledge</h2>
        <p className="dl-text">
          The docs assume basic TypeScript and Bun familiarity. These will help:
        </p>
        <ul className="dl-list">
          <li>TypeScript (types, interfaces, async/await)</li>
          <li>Bun (running scripts, <code>bun install</code>, stdin/stdout)</li>
          <li>Terminal basics (ANSI escape codes are handled for you, but knowing they exist helps)</li>
        </ul>
        <p className="dl-text">
          If you know React, the JSX package will feel familiar. If you do not, the widget-tree API works without JSX.
        </p>
      </section>

      <div className="docs-divider">
        <span className="docs-divider-label">Next Steps</span>
      </div>

      <div className="docs-paths">
        {SECTIONS.map((s) => (
          <Link key={s.label} href={s.href} className="docs-path-card">
            <div className="dpc-accent-line" />
            <div className="dpc-body">
              <div className="dpc-top">
                <span className="dpc-label">{s.label}</span>
                <span className="dpc-arrow">→</span>
              </div>
              <p className="dpc-desc">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="docs-divider">
        <span className="docs-divider-label">All Packages</span>
      </div>

      <div className="docs-packages">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.name}
            className="docs-pkg-card"
            style={{ '--pkg-accent': pkg.accent, '--pkg-accent-glow': pkg.accent + '18' } as React.CSSProperties}
          >
            <div className="dck-header">
              <span className="dck-at">@termuijs/</span>
              <span className="dck-name" style={{ color: pkg.accent }}>{pkg.name}</span>
            </div>
            <p className="dck-desc">{pkg.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params

  if (!slug || slug.length === 0) {
    return <DocsLanding />
  }

  const mod = await getDocPage(slug)
  if (!mod) notFound()

  const MDX = mod.default
  const fm = mod.frontmatter as { title?: string; description?: string } | undefined

  const SITE = 'https://termui.io'
  const section = slug[0] ?? ''
  const sectionLabel = section.replace(/(^|-)([a-z])/g, (_m, _s, c) => ' ' + c.toUpperCase()).trim()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Docs', item: `${SITE}/docs` },
          { '@type': 'ListItem', position: 2, name: sectionLabel || 'Docs', item: `${SITE}/docs/${section}` },
          { '@type': 'ListItem', position: 3, name: fm?.title ?? slug.join('/'), item: `${SITE}/docs/${slug.join('/')}` },
        ],
      },
      {
        '@type': 'TechArticle',
        headline: fm?.title ?? slug.join('/'),
        description: fm?.description,
        url: `${SITE}/docs/${slug.join('/')}`,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'TermUI', url: SITE },
        about: { '@type': 'SoftwareApplication', name: 'TermUI', applicationCategory: 'DeveloperApplication' },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DocBreadcrumb />
      <div className="doc-content-wrapper">
        <MDX components={getMDXComponents()} />
      </div>
      <PrevNext />
      <FeedbackWidget />
    </>
  )
}
