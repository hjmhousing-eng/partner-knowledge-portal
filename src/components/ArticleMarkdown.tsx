import ReactMarkdown from "react-markdown";

export function ArticleMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="prose">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
