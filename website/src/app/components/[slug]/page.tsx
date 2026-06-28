import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import rawRegistry from '@/data/registry.json'
import { PackageTabs } from '@/components/docs/PackageTabs'
import { CodeTabs, TabsList, TabsTrigger, TabsContent } from '@/components/docs/CodeTabs'
import { ApiTable } from '@/components/docs/ApiTable'
import { BrowserPreviewLoader } from '@/components/docs/BrowserPreviewLoader'
import { getComponentSource } from '@/lib/component-source'
import { Code } from '@/components/docs/Code'
import { CodeCollapsible } from '@/components/docs/CodeCollapsible'
import demoSlugs from '../../../data/demoSlugs'

interface RegistryEntry {
    name: string
    slug: string
    package: string
    importPath: string
    category: string
    description: string
    tags: string[]
    api: {
        signature: string
        props: Array<{ name: string; type: string; required: boolean; description: string }>
    } | null
}

const registry = rawRegistry as RegistryEntry[]

const PKG_SHORT: Record<string, string> = {
    '@termuijs/widgets': 'widgets',
    '@termuijs/ui':      'ui',
    '@termuijs/jsx':     'jsx',
    '@termuijs/tss':     'tss',
}

export function generateStaticParams() {
    return registry.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const comp = registry.find((c) => c.slug === slug)
    if (!comp) return {}
    const canonical = `/components/${comp.slug}`
    const title = `${comp.name} · TermUI`
    return {
        title,
        description: comp.description,
        alternates: { canonical },
        openGraph: { title, description: comp.description, url: canonical, type: 'article' },
        twitter: { card: 'summary_large_image', title, description: comp.description },
    }
}

/* ── Preview ASCII art per category ── */
const PREVIEW: Record<string, (n: string, d: string) => string> = {
    display: (n, d) => [
        `┌─ ${n} ${'─'.repeat(Math.max(0, 40 - n.length))}┐`,
        `│                                              │`,
        `│  ${d.slice(0, 44).padEnd(44)}  │`,
        `│                                              │`,
        `└──────────────────────────────────────────────┘`,
    ].join('\n'),

    input: (n) => [
        `  ? ${n}`,
        `  ❯ option-01`,
        `    option-02`,
        `    option-03`,
        ``,
        `  [↑↓] navigate   [Enter] select   [Esc] cancel`,
    ].join('\n'),

    feedback: (n, d) => [
        `  ┌────────────────────────────────────────────┐`,
        `  │ ◆ ${n.padEnd(41)}│`,
        `  │   ${d.slice(0, 41).padEnd(41)}│`,
        `  └────────────────────────────────────────────┘`,
    ].join('\n'),

    layout: (n) => [
        `  ┌─ sidebar ──────┐  ┌─ ${n} ${'─'.repeat(Math.max(0, 14 - n.length))}┐`,
        `  │                │  │                      │`,
        `  │  navigation    │  │    main content      │`,
        `  │                │  │                      │`,
        `  └────────────────┘  └──────────────────────┘`,
    ].join('\n'),

    data: (n) => [
        `  ID    ${n.slice(0, 14).padEnd(14)}  Value       Status`,
        `  ──────────────────────────────────────────────`,
        `  001   item-alpha          ████████    active`,
        `  002   item-beta           ██████░░    pending`,
        `  003   item-gamma          ████░░░░    idle`,
    ].join('\n'),

    hook: (n) => [
        `  const { value, set, reset } = use${n}({`,
        `    initial: undefined,`,
        `    persist: false,`,
        `  })`,
        ``,
        `  // value  → reactive state`,
        `  // set    → update fn`,
        `  // reset  → restore initial`,
    ].join('\n'),

    template: (n) => [
        `  ┌────────────────────────────────────────────┐`,
        `  │  ${n.padEnd(42)}│`,
        `  ├────────────────────────────────────────────┤`,
        `  │  header                                    │`,
        `  │  ┌──────────┐ ┌──────────────────────────┐│`,
        `  │  │   nav    │ │  content                 ││`,
        `  │  └──────────┘ └──────────────────────────┘│`,
        `  └────────────────────────────────────────────┘`,
    ].join('\n'),
}

const isLong = (code: string) => code.split('\n').length > 15

/* ── Usage snippets per category ── */
function getUsageSnippet(comp: RegistryEntry): string {
    const { name, category } = comp
    switch (category) {
        case 'input':
            return [
                `const [value, setValue] = useState('')`,
                ``,
                `<${name}`,
                `  value={value}`,
                `  onChange={setValue}`,
                `  placeholder="Enter text..."`,
                `/>`,
            ].join('\n')
        case 'feedback':
            return [
                `<${name}`,
                `  message="Operation completed"`,
                `  variant="success"`,
                `/>`,
            ].join('\n')
        case 'layout':
            return [`<${name}>`, `  <YourComponent />`, `</${name}>`].join('\n')
        case 'data':
            return [
                `const items = [`,
                `  { id: '001', label: 'item-alpha', value: 80 },`,
                `  { id: '002', label: 'item-beta',  value: 60 },`,
                `]`,
                ``,
                `<${name} items={items} />`,
            ].join('\n')
        case 'hook':
            return [
                `const { value, set, reset } = ${name}({`,
                `  initial: undefined,`,
                `})`,
            ].join('\n')
        case 'template':
            return [
                `<${name} title="My App">`,
                `  <YourContent />`,
                `</${name}>`,
            ].join('\n')
        default:
            return `<${name} />`
    }
}

/* ── API table per category ── */
const API_PROPS: Record<string, string[][]> = {
    display: [
        ['children',  'ReactNode',           'required', 'Content to render'],
        ['style',     'Styles',              '{}',       'Ink style object'],
        ['width',     'number | string',     '—',        'Fixed width in columns'],
        ['height',    'number',              '—',        'Fixed height in rows'],
    ],
    input: [
        ['value',      'string',               'required', 'Controlled value'],
        ['onChange',   '(v: string) => void',  'required', 'Change callback'],
        ['placeholder','string',               '—',        'Placeholder text'],
        ['isDisabled', 'boolean',              'false',    'Disable interaction'],
        ['autoFocus',  'boolean',              'false',    'Focus on mount'],
    ],
    feedback: [
        ['message',   'string',               'required', 'Feedback message'],
        ['variant',   '"success"|"error"|"warning"|"info"', '"info"', 'Visual variant'],
        ['onDismiss', '() => void',           '—',        'Dismiss callback'],
        ['duration',  'number',               '3000',     'Auto-dismiss in ms'],
    ],
    layout: [
        ['children',  'ReactNode',           'required', 'Layout content'],
        ['direction', '"row" | "column"',    '"column"', 'Flex direction'],
        ['gap',       'number',              '0',        'Gap between children'],
        ['padding',   'number',              '0',        'Inner padding'],
    ],
    data: [
        ['items',     'T[]',                 'required', 'Data rows'],
        ['columns',   'Column[]',            'required', 'Column definitions'],
        ['onSelect',  '(item: T) => void',   '—',        'Row select handler'],
        ['loading',   'boolean',             'false',    'Loading state'],
    ],
    hook: [
        ['initial',   'T | undefined',       '—',        'Initial value'],
        ['persist',   'boolean',             'false',    'Persist to storage'],
        ['key',       'string',              '—',        'Storage key'],
    ],
    template: [
        ['children',  'ReactNode',           'required', 'Page content'],
        ['title',     'string',              '—',        'App/page title'],
        ['padding',   'number',              '1',        'Outer padding'],
    ],
}

export default async function ComponentDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const comp = registry.find((c) => c.slug === slug)
    if (!comp) notFound()

    const pkgShort  = PKG_SHORT[comp.package] ?? comp.package
    const ascii     = PREVIEW[comp.category]?.(comp.name, comp.description)
                        ?? `  ${comp.name}\n\n  ${comp.description.slice(0, 52)}`
    const importLine = `import { ${comp.name} } from '${comp.importPath}'`
    const usageSnip = getUsageSnippet(comp)
    const source = getComponentSource(comp.slug)
    const cliDeps = source?.dependencies ?? [comp.package]
    const apiProps  = API_PROPS[comp.category] ?? API_PROPS.display

    const hasApi = comp.api != null && comp.api.props.length > 0
    const apiColumns = hasApi
        ? ['Prop', 'Type', 'Required', 'Description']
        : ['Prop', 'Type', 'Default', 'Description']
    const apiRows = hasApi
        ? comp.api!.props.map((p) => [
              p.name,
              p.type,
              p.required ? 'required' : 'optional',
              p.description || '—',
          ])
        : apiProps

    const SITE = 'https://termui.io'
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Components', item: `${SITE}/components` },
                    { '@type': 'ListItem', position: 2, name: comp.name, item: `${SITE}/components/${comp.slug}` },
                ],
            },
            {
                '@type': 'SoftwareSourceCode',
                name: comp.name,
                description: comp.description,
                codeRepository: 'https://github.com/Karanjot786/TermUI',
                programmingLanguage: 'TypeScript',
                runtimePlatform: 'Node.js',
                url: `${SITE}/components/${comp.slug}`,
                isPartOf: { '@type': 'SoftwareApplication', name: 'TermUI', applicationCategory: 'DeveloperApplication' },
            },
        ],
    }

    return (
        <div className="cd-page">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {/* Breadcrumb */}
            <nav className="cd-breadcrumb" aria-label="Breadcrumb">
                <Link href="/components" className="cd-bc-link">components</Link>
                <span className="cd-bc-sep">/</span>
                <span className="cd-bc-current">{comp.slug}</span>
            </nav>

            <div className="cd-layout">

                {/* ═══ Main content ═══ */}
                <main className="cd-main">

                    {/* Header */}
                    <header className="cd-header">
                        <div className="cd-title-row">
                            <h1 className="cd-title">{comp.name}</h1>
                            <div className="cd-badges">
                                <span className={`cb-badge cb-badge--${pkgShort}`}>{pkgShort}</span>
                                <span className="cd-cat-badge">{comp.category}</span>
                            </div>
                        </div>
                        <p className="cd-description">{comp.description}</p>
                    </header>

                    {/* Mac window preview */}
                    <div
                        className="cd-mac-window"
                        role="img"
                        aria-label={`Preview of ${comp.name}`}
                    >
                        <div className="cd-mac-chrome">
                            <div className="cd-mac-dots" aria-hidden="true">
                                <span className="cd-dot cd-dot-red"   />
                                <span className="cd-dot cd-dot-yellow"/>
                                <span className="cd-dot cd-dot-green" />
                            </div>
                            <span className="cd-mac-title">Terminal</span>
                            <div className="cd-mac-trailing" />
                        </div>
                        <div className="cd-mac-prompt">
                            <span className="cd-mac-ps">$</span>
                            <span>termuijs render {comp.slug}</span>
                        </div>
                        {demoSlugs.has(comp.slug)
                            ? <div className="cd-mac-body">
                                  <BrowserPreviewLoader slug={comp.slug} mouse />
                              </div>
                            : <pre className="cd-mac-body">
                                  <code>{ascii}</code>
                                  <span className="cd-cursor" aria-hidden="true">▌</span>
                              </pre>
                        }
                    </div>

                    {/* Installation */}
                    <section className="cd-section" id="installation">
                        <h2 className="cd-section-heading">Installation</h2>
                        <CodeTabs defaultValue="cli">
                            <TabsList>
                                <TabsTrigger value="cli">CLI</TabsTrigger>
                                <TabsTrigger value="package">Package</TabsTrigger>
                                <TabsTrigger value="manual">Manual</TabsTrigger>
                            </TabsList>

                            <TabsContent value="cli">
                                <PackageTabs
                                    npx={`npx termuijs@latest add ${comp.slug}`}
                                    bunx={`bunx termuijs add ${comp.slug}`}
                                    pnpm={`pnpm dlx termuijs add ${comp.slug}`}
                                    yarn={`yarn dlx termuijs add ${comp.slug}`}
                                />
                                <p className="cd-install-note">
                                    Copies the source into <code>src/components/{comp.slug}/</code> and installs {cliDeps.join(', ')}.
                                </p>
                            </TabsContent>

                            <TabsContent value="package">
                                <PackageTabs
                                    npm={`npm install ${comp.package}`}
                                    pnpm={`pnpm add ${comp.package}`}
                                    yarn={`yarn add ${comp.package}`}
                                    bun={`bun add ${comp.package}`}
                                />
                            </TabsContent>

                            <TabsContent value="manual">
                                {source ? (
                                    <div className="cd-manual-source">
                                        <p className="cd-step-label">
                                            Create <code>src/components/{comp.slug}/{source.filePath}</code> with:
                                        </p>
                                        <CodeCollapsible collapsed={isLong(source.content)}>
                                            <Code code={source.content} lang="tsx" filename={source.filePath} />
                                        </CodeCollapsible>
                                        {source.dependencies.length > 0 && (
                                            <>
                                                <p className="cd-step-label">Then install:</p>
                                                <pre className="cd-code-block"><code>{`npm install ${source.dependencies.join(' ')}`}</code></pre>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="cd-manual-steps">
                                        {([
                                            ['Install the package',      `npm install ${comp.package}`],
                                            ['Import the component',     importLine],
                                            ['Use in your terminal app', usageSnip],
                                        ] as [string, string][]).map(([label, code], i) => (
                                            <div key={i} className="cd-step">
                                                <span className="cd-step-num">{i + 1}</span>
                                                <div className="cd-step-body">
                                                    <p className="cd-step-label">{label}</p>
                                                    <pre className="cd-code-block"><code>{code}</code></pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </CodeTabs>
                    </section>

                    {/* Usage */}
                    <section className="cd-section" id="usage">
                        <h2 className="cd-section-heading">Usage</h2>
                        <Code code={importLine} lang="ts" />
                        <CodeCollapsible collapsed={isLong(comp.api?.signature ?? usageSnip)}>
                            <Code code={comp.api?.signature ?? usageSnip} lang="ts" />
                        </CodeCollapsible>
                    </section>

                    {/* API Reference */}
                    <section className="cd-section" id="api">
                        <h2 className="cd-section-heading">API Reference</h2>
                        <h3 className="cd-api-subheading">{comp.name}</h3>
                        <ApiTable
                            columns={apiColumns}
                            rows={apiRows}
                        />
                    </section>

                    {/* Tags */}
                    {comp.tags.length > 0 && (
                        <div className="cd-tags">
                            {comp.tags.map((tag) => (
                                <span key={tag} className="cd-tag">#{tag}</span>
                            ))}
                        </div>
                    )}

                </main>

                {/* ═══ Sidebar ═══ */}
                <aside className="cd-sidebar">
                    <div className="cd-sidebar-sticky">

                        {/* On this page */}
                        <section className="cd-toc">
                            <h2 className="cd-toc-title">On this page</h2>
                            <ul className="cd-toc-list">
                                <li><a href="#installation" className="cd-toc-link">Installation</a></li>
                                <li><a href="#usage"        className="cd-toc-link">Usage</a></li>
                                <li><a href="#api"          className="cd-toc-link">API Reference</a></li>
                            </ul>
                        </section>

                        {/* Meta */}
                        <section className="cd-panel cd-panel--meta">
                            <div className="cd-meta-row">
                                <span className="cd-meta-label">Package</span>
                                <code className="cd-meta-value">{pkgShort}</code>
                            </div>
                            <div className="cd-meta-row">
                                <span className="cd-meta-label">Category</span>
                                <span className="cd-meta-value">{comp.category}</span>
                            </div>
                            <div className="cd-meta-row">
                                <span className="cd-meta-label">Import</span>
                                <code className="cd-meta-value">{comp.importPath}</code>
                            </div>
                        </section>

                        <Link href={`/docs/${pkgShort}/overview`} className="cd-docs-link">
                            <span>{pkgShort} docs</span>
                            <span className="cd-docs-arrow">→</span>
                        </Link>

                    </div>
                </aside>

            </div>
        </div>
    )
}
