import { memo } from 'react';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { KMH_DOCS } from './docsContent';

/**
 * The Docs tab in the sidebar.
 *
 * Deliberately self-contained: it renders bundled markdown and reads nothing
 * from the app. Upstream can restructure state, routing or data fetching
 * without this needing to change, which keeps merges cheap.
 */
const KmhDocs = memo(() => (
  <div className="flex h-full flex-col overflow-y-auto px-4 py-3">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-1 text-lg font-semibold text-text-primary">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-6 text-base font-semibold text-text-primary">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-4 text-sm font-semibold text-text-primary">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 text-sm leading-relaxed text-text-secondary">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-border-medium pl-3 text-sm italic text-text-secondary">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-surface-tertiary px-1 py-0.5 font-mono text-xs text-text-primary">
            {children}
          </code>
        ),
        hr: () => <hr className="my-5 border-border-light" />,
        // Tables can outgrow a narrow sidebar, so they scroll in their own
        // container rather than pushing the panel sideways.
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-border-medium px-2 py-1.5 font-semibold text-text-primary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border-light px-2 py-1.5 align-top text-text-secondary">
            {children}
          </td>
        ),
      }}
    >
      {KMH_DOCS}
    </ReactMarkdown>
  </div>
));

KmhDocs.displayName = 'KmhDocs';

export default KmhDocs;
