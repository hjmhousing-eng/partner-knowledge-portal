"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useSearchParams } from "next/navigation";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  input: string;
  setInput: (value: string) => void;
  submit: (text?: string) => void;
  busy: boolean;
  searching: boolean;
  error: Error | undefined;
  messages: UIMessage[];
  headerRef: RefObject<HTMLInputElement | null>;
  focusHeader: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

function AskQueryOpener({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("ask") !== null) {
      setOpen(true);
    }
  }, [params, setOpen]);
  return null;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [coolingDown, setCoolingDown] = useState(false);
  const headerRef = useRef<HTMLInputElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  });

  const pending = status === "submitted" || status === "streaming";
  const busy = pending || coolingDown;

  useEffect(
    () => () => {
      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
      }
    },
    [],
  );

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const focusHeader = useCallback(() => {
    headerRef.current?.focus();
  }, []);

  const submit = useCallback(
    (text?: string) => {
      const question = (text ?? input).trim();
      if (!question || busy) {
        return;
      }
      setOpen(true);
      setInput("");
      setCoolingDown(true);
      cooldownTimer.current = setTimeout(() => {
        setCoolingDown(false);
        cooldownTimer.current = null;
      }, 5_000);
      void sendMessage({ text: question });
    },
    [busy, input, sendMessage],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        headerRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      input,
      setInput,
      submit,
      busy,
      searching: pending,
      error,
      messages,
      headerRef,
      focusHeader,
    }),
    [busy, error, focusHeader, input, messages, open, pending, submit, toggle],
  );

  return (
    <SearchContext.Provider value={value}>
      <Suspense fallback={null}>
        <AskQueryOpener setOpen={setOpen} />
      </Suspense>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const value = useContext(SearchContext);
  if (!value) {
    throw new Error("useSearch must be used inside SearchProvider");
  }
  return value;
}
