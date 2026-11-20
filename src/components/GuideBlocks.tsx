import type { Block, Guide } from "@/lib/index";

/** The marks after a block that say which sources it was written from: each a link to that source. */
export function Cites({ ids, guide }: { ids?: string[]; guide: Guide }) {
  // In the order of the list of sources, each once.
  const numbers = [...new Set((ids ?? []).map((id) => guide.sources.findIndex((s) => s.id === id) + 1).filter((n) => n > 0))].sort((a, b) => a - b);
  if (!numbers.length) return null;
  return (
    <span className="ml-1">
      {numbers.map((n, i) => (
        // A space between two marks lets a long run of them wrap on a narrow screen.
        <span key={n}>
          {i > 0 && " "}
          <a href={`#source-${n}`} className="cite" aria-label={`Source ${n}`}>
            [{n}]
          </a>
        </span>
      ))}
    </span>
  );
}

/** A guide's blocks, in order: paragraphs, lists, steps, tables and notes, each with its sources. */
export default function GuideBlocks({ blocks, guide }: { blocks: Block[]; guide: Guide }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "p")
          return (
            <p key={i}>
              {b.text}
              <Cites ids={b.sources} guide={guide} />
            </p>
          );
        if (b.type === "note")
          return (
            <p key={i} className="note body-3">
              {b.text}
              <Cites ids={b.sources} guide={guide} />
            </p>
          );
        if (b.type === "list" || b.type === "steps") {
          const List = b.type === "steps" ? "ol" : "ul";
          return (
            <List key={i}>
              {b.items.map((item, j) => (
                <li key={j}>
                  {item}
                  {j === b.items.length - 1 && <Cites ids={b.sources} guide={guide} />}
                </li>
              ))}
            </List>
          );
        }
        return (
          <div key={i} className="not-prose">
            {/* A wide table scrolls inside its own frame, which the keyboard can reach. */}
            <div className="table-wrap" tabIndex={0} role="region" aria-label={`Table: ${b.columns.slice(0, 3).join(", ")}`}>
              <table className="table">
                <thead>
                  <tr>
                    {b.columns.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) =>
                        c === 0 ? (
                          <th key={c} scope="row">
                            <Linked text={cell} />
                          </th>
                        ) : (
                          <td key={c} data-label={b.columns[c]}>
                            <Linked text={cell} />
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption-1 mt-2 text-ink-faint">
              Sources for this table:
              <Cites ids={b.sources} guide={guide} />
            </p>
          </div>
        );
      })}
    </>
  );
}

/** A cell that is a web address is shown as a link to it. */
function Linked({ text }: { text: string }) {
  if (!/^https?:\/\/\S+$/.test(text.trim())) return <>{text}</>;
  let host = text;
  try {
    host = new URL(text.trim()).hostname.replace(/^www\./, "");
  } catch {
    return <>{text}</>;
  }
  return (
    <a href={text.trim()} rel="noopener" className="data-2 inline-flex min-h-6 items-center wrap-anywhere">
      {host}
    </a>
  );
}
