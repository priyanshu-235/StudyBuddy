import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function normalizeAiContent(content) {
  if (!content) {
    return '';
  }

  return content
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

function ChatMessageContent({ content, isStreaming }) {
  const normalized = normalizeAiContent(content);

  if (!normalized) {
    return isStreaming ? (
      <span className="inline-flex items-center gap-1 text-slate-400">
        <span className="loading loading-dots loading-xs" />
        Thinking…
      </span>
    ) : null;
  }

  return (
    <div className="chat-markdown text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-slate-200">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-emerald-200">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold text-emerald-200 mt-2 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-emerald-200 mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-emerald-200/90 mt-2 mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500/40 pl-3 my-2 text-slate-400 italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
            >
              {children}
            </a>
          ),
          code: ({ inline, className, children }) => {
            const language = className?.replace('language-', '') || 'text';

            if (inline) {
              return (
                <code className="px-1 py-0.5 rounded bg-slate-950/70 border border-emerald-500/15 text-emerald-200 font-mono text-[0.85em]">
                  {children}
                </code>
              );
            }

            return (
              <div className="my-2 rounded-lg overflow-hidden border border-emerald-500/15">
                {language !== 'text' && (
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wide bg-slate-950/80 text-emerald-400/70 border-b border-emerald-500/10">
                    {language}
                  </div>
                )}
                <pre className="overflow-x-auto p-3 bg-slate-950/70 text-slate-200 font-mono text-xs leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-emerald-400/80 animate-pulse rounded-sm" />
      )}
    </div>
  );
}

export default ChatMessageContent;
