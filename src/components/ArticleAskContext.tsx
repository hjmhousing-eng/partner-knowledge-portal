"use client";

import { useEffect } from "react";
import { useSearch, type AskPageContext } from "./SearchContext";

export function ArticleAskContext({
  context,
}: {
  context: AskPageContext;
}) {
  const { registerPageContext, pinPageContext } = useSearch();

  useEffect(() => {
    return registerPageContext(context);
  }, [context, registerPageContext]);

  return (
    <button
      type="button"
      className="article-ask-action"
      onClick={() => pinPageContext(context)}
    >
      Ask about this article
    </button>
  );
}
