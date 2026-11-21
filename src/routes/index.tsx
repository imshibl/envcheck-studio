import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  CircleAlert,
  CircleCheck,
  FileCode2,
  FileJson2,
  FileText,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildExampleFile,
  buildMarkdownReport,
  buildSafeReport,
  compareEnvFiles,
  parseEnv,
  type ComparisonMode,
  type EnvIssue,
  type EnvSide,
  type IssueSeverity,
  type IssueType,
} from "@/lib/envcheck";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnvCheck — Private .env comparison and validation" },
      {
        name: "description",
        content:
          "Compare and validate .env files in your browser. Find missing variables, duplicate declarations, empty values, syntax errors, and configuration differences without sending secrets anywhere.",
      },
      { property: "og:title", content: "EnvCheck — Private .env comparison and validation" },
      {
        property: "og:description",
        content: "Compare and validate .env files locally, with no uploads or saved secrets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type EnvironmentName = "Development" | "Staging" | "Production";
type IssueFilter = "all" | IssueType;

const environmentNames: EnvironmentName[] = ["Development", "Staging", "Production"];
const sampleLeft = [
  "VITE_API_URL=https://dev.api.example.com",
  "APP_ENV=development",
  "SESSION_SECRET=demo-value-only",
  "CACHE_TTL=300",
  "FEATURE_CHECKOUT=true",
  "OPTIONAL_NOTE=",
].join("\n");
const sampleRight = [
  "VITE_API_URL=https://staging.api.example.com",
  "APP_ENV=staging",
  "SESSION_SECRET=",
  "CACHE_TTL=600",
  "FEATURE_SEARCH=true",
].join("\n");

const issueFilters: { value: IssueFilter; label: string }[] = [
  { value: "all", label: "All issues" },
  { value: "missing", label: "Missing" },
  { value: "extra", label: "Extra" },
  { value: "different", label: "Different" },
  { value: "empty", label: "Empty" },
  { value: "duplicate", label: "Duplicates" },
  { value: "syntax", label: "Syntax" },
];

const issueTitles: Record<IssueType, string> = {
  missing: "Missing variable",
  extra: "Extra variable",
  different: "Value difference",
  empty: "Empty value",
  duplicate: "Duplicate declaration",
  syntax: "Syntax error",
};

const severityClasses: Record<IssueSeverity, string> = {
  critical: "border-critical/30 bg-critical/10 text-critical",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
};

const severityLabels: Record<IssueSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

function downloadText(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function FilePane({
  side,
  mode,
  name,
  value,
  filename,
  onNameChange,
  onValueChange,
  onFileLoaded,
  onError,
}: {
  side: EnvSide;
  mode: ComparisonMode;
  name: EnvironmentName;
  value: string;
  filename: string;
  onNameChange: (name: EnvironmentName) => void;
  onValueChange: (value: string) => void;
  onFileLoaded: (value: string, filename: string) => void;
  onError: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const fileLabel = mode === "template" ? (side === "left" ? "Actual .env" : ".env.example") : name;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    void file
      .text()
      .then((content) => onFileLoaded(content, file.name))
      .catch(() => onError("Couldn't read that file. Try a plain-text .env file."));
  };

  return (
    <section className="min-w-0 bg-panel" aria-label={`${fileLabel} file editor`}>
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {side === "left" ? "File A" : "File B"}
          </span>
          {mode === "template" ? (
            <span className="truncate text-sm font-semibold text-foreground">{fileLabel}</span>
          ) : (
            <select
              aria-label={`${side === "left" ? "First" : "Second"} environment`}
              value={name}
              onChange={(event) => onNameChange(event.target.value as EnvironmentName)}
              className="h-8 max-w-40 rounded-sm border border-border bg-background px-2 text-sm font-semibold text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {environmentNames.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {filename && (
            <span className="max-w-32 truncate font-mono text-[11px] text-muted-foreground" title={filename}>
              {filename}
            </span>
          )}
          <input
            ref={fileInput}
            aria-label={`Upload ${fileLabel} file`}
            type="file"
            accept=".env,.txt,text/plain"
            className="sr-only"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden="true" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <Textarea
          aria-label={`Paste ${fileLabel} contents`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={side === "left" ? "Paste .env contents here…" : "Paste comparison file here…"}
          className="env-textarea min-h-52 resize-y border-0 bg-editor px-3.5 py-3 font-mono text-[12px] leading-6 shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring sm:min-h-56"
        />
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground sm:px-5">
        <LockKeyhole className="size-3.5 text-success" aria-hidden="true" />
        <span>Read and compared on this device only</span>
      </div>
    </section>
  );
}

function Index() {
  const [mode, setMode] = useState<ComparisonMode>("environments");
  const [leftName, setLeftName] = useState<EnvironmentName>("Development");
  const [rightName, setRightName] = useState<EnvironmentName>("Production");
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftFilename, setLeftFilename] = useState("");
  const [rightFilename, setRightFilename] = useState("");
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [fileError, setFileError] = useState("");
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const leftLabel = mode === "template" ? "Actual .env" : leftName;
  const rightLabel = mode === "template" ? ".env.example" : rightName;
  const result = useMemo(
    () => compareEnvFiles(leftText, rightText, { mode, leftLabel, rightLabel }),
    [leftText, rightText, mode, leftLabel, rightLabel],
  );
  const visibleIssues = result.issues.filter((issue) => filter === "all" || issue.type === filter);
  const filterCounts = useMemo(() => {
    const counts: Record<IssueFilter, number> = {
      all: result.issues.length,
      missing: 0,
      extra: 0,
      different: 0,
      empty: 0,
      duplicate: 0,
      syntax: 0,
    };
    for (const issue of result.issues) counts[issue.type] += 1;
    return counts;
  }, [result.issues]);
  const severityCounts = useMemo(
    () =>
      result.issues.reduce(
        (counts, issue) => {
          counts[issue.severity] += 1;
          return counts;
        },
        { critical: 0, warning: 0, info: 0 },
      ),
    [result.issues],
  );

  const clearFiles = () => {
    setLeftText("");
    setRightText("");
    setLeftFilename("");
    setRightFilename("");
    setFileError("");
    setSampleLoaded(false);
    setFilter("all");
  };

  const loadSample = () => {
    setMode("environments");
    setLeftName("Development");
    setRightName("Production");
    setLeftText(sampleLeft);
    setRightText(sampleRight);
    setLeftFilename("");
    setRightFilename("");
    setFileError("");
    setSampleLoaded(true);
    setFilter("all");
  };

  const updateFile = (side: EnvSide, content: string, filename = "") => {
    setFileError("");
    setSampleLoaded(false);
    if (side === "left") {
      setLeftText(content);
      setLeftFilename(filename);
    } else {
      setRightText(content);
      setRightFilename(filename);
    }
  };

  const handleDownloadExample = () => {
    const file = buildExampleFile(parseEnv(leftText));
    downloadText(".env.example", `${file}\n`, "text/plain;charset=utf-8");
  };

  const hasFiles = leftText.trim().length > 0 || rightText.trim().length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-[68px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 text-foreground no-underline">
            <span className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
              <FileCode2 className="size-[17px]" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-[0.01em]">EnvCheck</span>
            <span className="hidden border-l border-border pl-2.5 font-mono text-[11px] text-muted-foreground sm:inline">
              .env diff
            </span>
          </a>
          <div className="flex items-center gap-2 rounded-sm border border-success/20 bg-success/5 px-2.5 py-1.5 text-[11px] font-medium text-success sm:px-3">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>LOCAL ONLY</span>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1360px] px-4 pb-10 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-5 py-7 sm:flex-row sm:items-end sm:py-9">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Environment file utility
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              Compare without exposing secrets.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Inspect environment configs, catch missing keys, and validate against a template.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sampleLoaded && (
              <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
                Sample data
              </Badge>
            )}
            <Button type="button" variant="outline" size="sm" onClick={loadSample}>
              <RotateCcw aria-hidden="true" />
              Load sample
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearFiles} disabled={!hasFiles}>
              Clear files
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-border/80 bg-panel" aria-label="Environment comparison tool">
          <div className="flex flex-col gap-3 border-b border-border/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Comparison mode">
              <Button
                type="button"
                role="tab"
                aria-selected={mode === "environments"}
                variant={mode === "environments" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setMode("environments");
                  setFilter("all");
                }}
              >
                <ArrowLeftRight aria-hidden="true" />
                Compare environments
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={mode === "template"}
                variant={mode === "template" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setMode("template");
                  setFilter("all");
                }}
              >
                <FileCode2 aria-hidden="true" />
                Validate against template
              </Button>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {result.left.entries.length + result.right.entries.length} declarations scanned
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border/70 lg:grid-cols-2">
            <FilePane
              side="left"
              mode={mode}
              name={leftName}
              value={leftText}
              filename={leftFilename}
              onNameChange={(name) => {
                setLeftName(name);
                setSampleLoaded(false);
              }}
              onValueChange={(value) => updateFile("left", value)}
              onFileLoaded={(value, filename) => updateFile("left", value, filename)}
              onError={setFileError}
            />
            <FilePane
              side="right"
              mode={mode}
              name={rightName}
              value={rightText}
              filename={rightFilename}
              onNameChange={(name) => {
                setRightName(name);
                setSampleLoaded(false);
              }}
              onValueChange={(value) => updateFile("right", value)}
              onFileLoaded={(value, filename) => updateFile("right", value, filename)}
              onError={setFileError}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
              {fileError ? (
                <>
                  <CircleAlert className="size-4 text-critical" aria-hidden="true" />
                  <span>{fileError}</span>
                </>
              ) : (
                <>
                  <LockKeyhole className="size-3.5 text-success" aria-hidden="true" />
                  <span>File contents stay in memory and are never sent or saved.</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadExample} disabled={!leftText.trim()}>
                <FileCode2 aria-hidden="true" />
                Generate .env.example
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="findings-title">
          <div className="flex flex-col justify-between gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="findings-title" className="text-lg font-semibold">Findings</h2>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {result.issues.length} {result.issues.length === 1 ? "issue" : "issues"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasFiles ? `Reviewing ${leftLabel} and ${rightLabel}.` : "Add files to see configuration findings."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={result.issues.length === 0}
                onClick={() => downloadText("envcheck-report.md", buildMarkdownReport(result), "text/markdown;charset=utf-8")}
              >
                <FileText aria-hidden="true" />
                Markdown
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={result.issues.length === 0}
                onClick={() => downloadText("envcheck-report.json", JSON.stringify(buildSafeReport(result), null, 2), "application/json;charset=utf-8")}
              >
                <FileJson2 aria-hidden="true" />
                JSON
              </Button>
            </div>
          </div>

          <div className="my-4 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-sm border border-border/70 bg-panel">
            {(["critical", "warning", "info"] as const).map((severity) => (
              <div key={severity} className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <span className="text-xs text-muted-foreground">{severityLabels[severity]}</span>
                <span className={`font-mono text-sm font-semibold ${severity === "critical" ? "text-critical" : severity === "warning" ? "text-warning" : "text-info"}`}>
                  {severityCounts[severity]}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Filter findings">
            {issueFilters.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={filter === option.value ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={filter === option.value}
                className="shrink-0 gap-1.5 px-2.5 text-xs"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                <span className="font-mono text-[10px] text-muted-foreground">{filterCounts[option.value]}</span>
              </Button>
            ))}
          </div>

          {visibleIssues.length > 0 ? (
            <div className="overflow-hidden rounded-sm border border-border/70 bg-panel">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-border/70 hover:bg-transparent">
                    <TableHead className="w-32 pl-4">Severity</TableHead>
                    <TableHead className="w-52">Issue</TableHead>
                    <TableHead className="w-48">Variable</TableHead>
                    <TableHead>Details &amp; suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} resultLeftLabel={leftLabel} resultRightLabel={rightLabel} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex min-h-36 flex-col items-center justify-center border border-dashed border-border/80 px-5 py-8 text-center">
              {result.issues.length === 0 && hasFiles ? (
                <CircleCheck className="mb-3 size-6 text-success" aria-hidden="true" />
              ) : (
                <ArrowDownToLine className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
              )}
              <p className="text-sm font-medium text-foreground">
                {result.issues.length === 0 && hasFiles
                  ? "No configuration issues found"
                  : filter === "all"
                    ? "No files to compare yet"
                    : "No findings in this category"}
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                {result.issues.length === 0 && hasFiles
                  ? "Both files are syntactically valid and contain matching keys and values."
                  : filter === "all"
                    ? "Paste environment files above or load sample data to see the comparison."
                    : "Choose another filter to review the remaining findings."}
              </p>
            </div>
          )}
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            No uploads. No saved files. No accounts.
          </span>
          <span className="font-mono">dotenv-compatible · local processing</span>
        </footer>
      </main>
    </div>
  );
}

function IssueRow({
  issue,
  resultLeftLabel,
  resultRightLabel,
}: {
  issue: EnvIssue;
  resultLeftLabel: string;
  resultRightLabel: string;
}) {
  const sideLabel = issue.side === "left" ? resultLeftLabel : issue.side === "right" ? resultRightLabel : "Both";

  return (
    <TableRow className="border-border/60 align-top">
      <TableCell className="pl-4 pt-3.5">
        <Badge variant="outline" className={severityClasses[issue.severity]}>
          {severityLabels[issue.severity]}
        </Badge>
      </TableCell>
      <TableCell className="pt-3.5 text-xs font-medium text-foreground">{issueTitles[issue.type]}</TableCell>
      <TableCell className="pt-3.5">
        <code className="break-all rounded-sm bg-editor px-1.5 py-1 font-mono text-[11px] text-foreground">
          {issue.key ?? "—"}
        </code>
        <div className="mt-1.5 text-[10px] text-muted-foreground">{sideLabel}{issue.line ? ` · line ${issue.line}` : ""}</div>
      </TableCell>
      <TableCell className="max-w-[480px] py-3.5 pr-4">
        <p className="text-xs leading-5 text-foreground/90">{issue.detail}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{issue.suggestion}</p>
      </TableCell>
    </TableRow>
  );
}