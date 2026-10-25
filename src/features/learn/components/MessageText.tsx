import React from "react";
import { cn } from "../../../ui";

/** Chat text with ```code blocks```, `inline code` and clickable links. */
export const MessageText: React.FC<{ text: string; mine?: boolean }> = ({ text, mine }) => {
  const blocks = text.split(/```/);
  return (
    <div className="space-y-2">
      {blocks.map((chunk, bi) => {
        if (bi % 2 === 1) {
          const code = chunk.replace(/^[a-z0-9+#-]*\n/i, "").replace(/\n$/, "");
          return (
            <pre
              key={bi}
              className={cn(
                "max-w-full overflow-x-auto rounded-xl px-3 py-2 font-mono text-[13px] leading-5",
                mine ? "bg-black/25 text-white" : "bg-slate-950 text-slate-100",
              )}
            >
              <code>{code}</code>
            </pre>
          );
        }
        if (!chunk.trim()) return null;
        return (
          <p key={bi} className="whitespace-pre-wrap break-words">
            {chunk.split(/(`[^`\n]+`|https?:\/\/[^\s)]+)/g).map((part, pi) => {
              if (/^`[^`]+`$/.test(part))
                return (
                  <code key={pi} className={cn("rounded px-1 py-0.5 font-mono text-[13px]", mine ? "bg-black/25" : "bg-paper dark:bg-slate-800")}>
                    {part.slice(1, -1)}
                  </code>
                );
              if (/^https?:\/\//.test(part))
                return (
                  <a key={pi} href={part} target="_blank" rel="noopener noreferrer" className={cn("break-all underline underline-offset-2", mine ? "text-white" : "text-teal-700 dark:text-teal-300")}>
                    {part}
                  </a>
                );
              return <React.Fragment key={pi}>{part}</React.Fragment>;
            })}
          </p>
        );
      })}
    </div>
  );
};
