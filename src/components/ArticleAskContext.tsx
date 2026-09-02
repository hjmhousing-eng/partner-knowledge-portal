"use client";

import { useEffect } from "react";
import { useSearch, type AskPageContext } from "./SearchContext";

export function ArticleAskContext({
  context,
}: {
  context: AskPageContext;
}) {
  const { setPageContext } = useSearch();

  useEffect(() => {
    setPageContext(context);
    return () => setPageContext(null);
  }, [context, setPageContext]);

  return null;
}
