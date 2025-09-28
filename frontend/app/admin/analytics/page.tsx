"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  type AnalyticsQueryPayload,
  type LogSearchHit,
  searchSystemLogs,
} from "../../lib/api";

type StatusMessage = { kind: "success" | "error"; text: string } | null;

type LevelOperator = "==" | "!=";
type MessageOperator = "CONTAINS" | "NOT_CONTAINS";
type TimestampOperator = ">" | ">=" | "<" | "<=" | "==";

const PAGE_SIZE = 20;

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function formatScore(score: number | null) {
  if (score === null || Number.isNaN(score)) {
    return "—";
  }
  return score.toFixed(2);
}

function appendExpression(previous: string, segment: string) {
  if (!previous.trim()) {
    return segment;
  }
  return `${previous.trimEnd()} ${segment}`;
}

function highlightMarkup(value: string | null) {
  if (!value) {
    return null;
  }
  return {
    __html: value
      .replaceAll("<em>", '<span class="bg-amber-500/20 px-1 rounded">')
      .replaceAll("</em>", "</span>"),
  };
}

export default function AnalyticsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LogSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [took, setTook] = useState(0);
  const [page, setPage] = useState(0);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);

  const [levelOperator, setLevelOperator] = useState<LevelOperator>("==");
  const [levelValue, setLevelValue] = useState("ERROR");
  const [messageOperator, setMessageOperator] =
    useState<MessageOperator>("CONTAINS");
  const [messageValue, setMessageValue] = useState("error");
  const [timestampOperator, setTimestampOperator] =
    useState<TimestampOperator>(">=");
  const [timestampValue, setTimestampValue] = useState("");

  const totalPages = useMemo(() => {
    if (total === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [total]);

  const executeSearch = useCallback(
    async (targetPage: number) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setStatus({
          kind: "error",
          text: "Define at least one search condition before running analytics.",
        });
        return;
      }

      const payload: AnalyticsQueryPayload = {
        query: trimmed,
        from: targetPage * PAGE_SIZE,
        size: PAGE_SIZE,
      };

      setIsSearching(true);
      setStatus(null);

      try {
        const response = await searchSystemLogs(payload);
        setResults(response.hits);
        setTotal(response.total);
        setTook(response.took);
        setTranslatedQuery(response.translatedQuery);
        setPage(targetPage);

        if (response.hits.length === 0) {
          setStatus({
            kind: "success",
            text: "No logs matched the provided criteria.",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to execute analytics search.";
        setStatus({ kind: "error", text: message });
      } finally {
        setIsSearching(false);
      }
    },
    [query]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await executeSearch(0);
    },
    [executeSearch]
  );

  const handleAppend = useCallback((segment: string) => {
    setQuery((previous) => appendExpression(previous, segment));
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setTotal(0);
    setTook(0);
    setTranslatedQuery(null);
    setStatus(null);
    setPage(0);
  }, []);

  const handleAddLevelCondition = useCallback(() => {
    if (!levelValue.trim()) {
      setStatus({ kind: "error", text: "Select a level before adding." });
      return;
    }
    const value = levelValue.trim().toUpperCase();
    handleAppend(`level ${levelOperator} "${value}"`);
  }, [handleAppend, levelOperator, levelValue]);

  const handleAddMessageCondition = useCallback(() => {
    if (!messageValue.trim()) {
      setStatus({
        kind: "error",
        text: "Provide text to search for in message content.",
      });
      return;
    }
    handleAppend(`message ${messageOperator} "${messageValue.trim()}"`);
  }, [handleAppend, messageOperator, messageValue]);

  const handleAddTimestampCondition = useCallback(() => {
    if (!timestampValue.trim()) {
      setStatus({
        kind: "error",
        text: "Provide a timestamp using ISO format before adding the rule.",
      });
      return;
    }
    handleAppend(`timestamp ${timestampOperator} "${timestampValue.trim()}"`);
  }, [handleAppend, timestampOperator, timestampValue]);

  const pageSummary = useMemo(() => {
    if (results.length === 0) {
      return "0 results";
    }
    const start = page * PAGE_SIZE + 1;
    const end = page * PAGE_SIZE + results.length;
    return `${start}-${end} of ${total} results`;
  }, [page, results.length, total]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">
                Analytics
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                System log observability
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Administrators can ship application log files to Elasticsearch,
                compose boolean queries, and inspect the most relevant events in
                real time.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300/80">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-white/30 px-4 py-2 transition hover:border-white hover:text-white"
              >
                Admin users
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-2 text-sm text-slate-300/90">
              <p className="font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Query builder
              </p>
              <p>
                Combine filters with <span className="font-semibold">AND</span>,
                <span className="font-semibold"> OR</span>, and
                <span className="font-semibold"> NOT</span>. Supported fields:
                <code className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs">
                  level
                </code>
                ,
                <code className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-xs">
                  message
                </code>
                ,
                <code className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-xs">
                  raw
                </code>
                ,
                <code className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-xs">
                  timestamp
                </code>
                , and
                <code className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-xs">
                  source
                </code>
                . Example:{" "}
                <code className="rounded bg-slate-800 px-2 py-0.5 text-xs">
                  (level == "ERROR" OR level == "WARN") AND message CONTAINS
                  "timeout"
                </code>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAppend("(")}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
              >
                (
              </button>
              <button
                type="button"
                onClick={() => handleAppend(")")}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
              >
                )
              </button>
              <button
                type="button"
                onClick={() => handleAppend("AND")}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => handleAppend("OR")}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
              >
                OR
              </button>
              <button
                type="button"
                onClick={() => handleAppend("NOT")}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
              >
                NOT
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-400"
              >
                Clear
              </button>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label
                htmlFor="analytics-query"
                className="text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Logical query
              </label>
              <textarea
                id="analytics-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='e.g. (level == "ERROR" OR level == "WARN") AND message CONTAINS "error"'
                className="min-h-[120px] w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Log level rule
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={levelOperator}
                    onChange={(event) =>
                      setLevelOperator(event.target.value as LevelOperator)
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs uppercase text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="==">is</option>
                    <option value="!=">is not</option>
                  </select>
                  <select
                    value={levelValue}
                    onChange={(event) => setLevelValue(event.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="ERROR">ERROR</option>
                    <option value="WARN">WARN</option>
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                    <option value="TRACE">TRACE</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddLevelCondition}
                  className="w-full rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400"
                >
                  Add level filter
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Message rule
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <select
                    value={messageOperator}
                    onChange={(event) =>
                      setMessageOperator(event.target.value as MessageOperator)
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs uppercase text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="CONTAINS">contains</option>
                    <option value="NOT_CONTAINS">does not contain</option>
                  </select>
                  <input
                    value={messageValue}
                    onChange={(event) => setMessageValue(event.target.value)}
                    placeholder="phrase or token"
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMessageCondition}
                  className="w-full rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-emerald-400"
                >
                  Add message filter
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                  Timestamp rule
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <select
                    value={timestampOperator}
                    onChange={(event) =>
                      setTimestampOperator(event.target.value as TimestampOperator)
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs uppercase text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value=">=">after or at</option>
                    <option value=">">after</option>
                    <option value="<=">before or at</option>
                    <option value="<">before</option>
                    <option value="==">exact</option>
                  </select>
                  <input
                    type="text"
                    value={timestampValue}
                    onChange={(event) => setTimestampValue(event.target.value)}
                    placeholder="2024-05-10T14:05:00Z"
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTimestampCondition}
                  className="w-full rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-amber-400"
                >
                  Add timestamp filter
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {pageSummary}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-full bg-sky-500 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching ? "Searching..." : "Run analytics"}
                </button>
                <button
                  type="button"
                  disabled={isSearching || page <= 0}
                  onClick={() => executeSearch(Math.max(0, page - 1))}
                  className="rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous page
                </button>
                <button
                  type="button"
                  disabled={
                    isSearching || page >= totalPages - 1 || results.length === 0
                  }
                  onClick={() => executeSearch(page + 1)}
                  className="rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next page
                </button>
              </div>
            </div>
          </form>

          {translatedQuery && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">
                Elasticsearch query
              </p>
              <code className="mt-2 block whitespace-pre-wrap break-words text-slate-100">
                {translatedQuery}
              </code>
            </div>
          )}
        </section>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-3xl border p-4 text-sm shadow-lg shadow-black/30 backdrop-blur transition ${
              status.kind === "error"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {status.text}
          </div>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Log results</h2>
              <p className="text-sm text-slate-400">
                {total} matching events • query evaluated in {took}ms
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {results.map((hit, index) => (
              <article
                key={`${hit.id ?? "hit"}-${index}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide">
                  <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sky-200">
                    {hit.level ?? "UNKNOWN"}
                  </span>
                  <span className="text-slate-400">
                    Score {formatScore(hit.score)}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {formatTimestamp(hit.timestamp)}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {hit.message ?? hit.raw ?? "No message available."}
                </p>
                {hit.highlight && (
                  <p
                    className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"
                    dangerouslySetInnerHTML={
                      highlightMarkup(hit.highlight) ?? undefined
                    }
                  />
                )}
                <div className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-slate-400">
                      Source file
                    </p>
                    <p className="mt-1 break-words text-slate-300">
                      {hit.source ?? "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="font-semibold uppercase tracking-wide text-slate-400">
                      Raw entry
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-[0.7rem] text-slate-300">
                      {hit.raw ?? "—"}
                    </pre>
                  </div>
                </div>
              </article>
            ))}

            {results.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Execute a search to populate the analytics timeline.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}