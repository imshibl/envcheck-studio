export type EnvSide = "left" | "right";
export type ComparisonMode = "environments" | "template";
export type IssueSeverity = "critical" | "warning" | "info";
export type IssueType = "missing" | "extra" | "empty" | "duplicate" | "syntax" | "different";

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

export interface ParseIssue {
  line: number;
  key: string | null;
  message: string;
}

export interface DuplicateDeclaration {
  key: string;
  lines: number[];
}

export interface ParsedEnv {
  entries: EnvEntry[];
  errors: ParseIssue[];
  duplicates: DuplicateDeclaration[];
}

export interface EnvIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  key: string | null;
  side: EnvSide | null;
  line: number | null;
  detail: string;
  suggestion: string;
}

export interface ComparisonResult {
  mode: ComparisonMode;
  leftLabel: string;
  rightLabel: string;
  left: ParsedEnv;
  right: ParsedEnv;
  issues: EnvIssue[];
}

const severityRank: Record<IssueSeverity, number> = { critical: 0, warning: 1, info: 2 };

function closingQuotePosition(value: string, quote: string): number {
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "\\" && quote === '"') {
      index += 1;
    } else if (character === quote) {
      return index;
    }
  }
  return -1;
}

function decodeDoubleQuotedValue(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
}

/** Parses dotenv assignments without evaluating interpolation or executing shell syntax. */
export function parseEnv(source: string): ParsedEnv {
  const lines = source.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const entries: EnvEntry[] = [];
  const errors: ParseIssue[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const physicalLine = lines[index];
    if (physicalLine === undefined) continue;

    let candidate = physicalLine.trimStart();
    if (candidate.length === 0 || candidate.startsWith("#")) continue;
    if (/^export(?:\s+|$)/.test(candidate)) {
      candidate = candidate.replace(/^export\s+/, "");
    }

    const assignment = /^([\w.-]+)\s*(?:=|:\s+)(.*)$/.exec(candidate);
    if (!assignment) {
      errors.push({ line: index + 1, key: null, message: "Expected a KEY=value assignment." });
      continue;
    }

    const key = assignment[1];
    const rawValue = assignment[2];
    if (key === undefined || rawValue === undefined) {
      errors.push({ line: index + 1, key: null, message: "Expected a KEY=value assignment." });
      continue;
    }

    const assignmentLine = index + 1;
    const valueStart = rawValue.trimStart();
    const firstCharacter = valueStart[0];
    let value: string;

    if (firstCharacter === '"' || firstCharacter === "'" || firstCharacter === "`") {
      const quote = firstCharacter;
      let combined = valueStart.slice(1);
      let closeIndex = closingQuotePosition(combined, quote);

      while (closeIndex < 0 && index + 1 < lines.length) {
        index += 1;
        const nextLine = lines[index];
        if (nextLine === undefined) break;
        combined += `\n${nextLine}`;
        closeIndex = closingQuotePosition(combined, quote);
      }

      if (closeIndex < 0) {
        errors.push({ line: assignmentLine, key, message: "Unclosed quoted value." });
        continue;
      }

      const quotedValue = combined.slice(0, closeIndex);
      const trailing = combined.slice(closeIndex + 1);
      if (!/^\s*(?:#.*)?$/.test(trailing)) {
        errors.push({ line: assignmentLine, key, message: "Unexpected text after the quoted value." });
      }
      value = quote === '"' ? decodeDoubleQuotedValue(quotedValue) : quotedValue;
    } else {
      value = valueStart.replace(/\s+#.*$/, "").trim();
    }

    entries.push({ key, value, line: assignmentLine });
  }

  const declarations = new Map<string, number[]>();
  for (const entry of entries) {
    const linesForKey = declarations.get(entry.key) ?? [];
    linesForKey.push(entry.line);
    declarations.set(entry.key, linesForKey);
  }

  const duplicates = Array.from(declarations.entries())
    .filter(([, declarationLines]) => declarationLines.length > 1)
    .map(([key, declarationLines]) => ({ key, lines: declarationLines }));

  return { entries, errors, duplicates };
}

function lastValues(parsed: ParsedEnv): Map<string, EnvEntry> {
  const values = new Map<string, EnvEntry>();
  for (const entry of parsed.entries) values.set(entry.key, entry);
  return values;
}

function compareValueLabel(mode: ComparisonMode, side: EnvSide, leftLabel: string, rightLabel: string) {
  if (mode === "template") return side === "left" ? "the actual file" : "the template";
  return side === "left" ? leftLabel : rightLabel;
}

/** Compares two parsed files while retaining no values in the returned issue list. */
export function compareEnvFiles(
  leftSource: string,
  rightSource: string,
  options: { mode: ComparisonMode; leftLabel: string; rightLabel: string },
): ComparisonResult {
  const left = parseEnv(leftSource);
  const right = parseEnv(rightSource);
  const issues: EnvIssue[] = [];

  const addIssue = (issue: Omit<EnvIssue, "id">) => {
    const identity = `${issue.type}:${issue.side ?? "both"}:${issue.key ?? issue.line ?? "file"}:${issue.line ?? ""}`;
    issues.push({ id: identity, ...issue });
  };

  const addFileIssues = (parsed: ParsedEnv, side: EnvSide) => {
    const label = compareValueLabel(options.mode, side, options.leftLabel, options.rightLabel);
    for (const error of parsed.errors) {
      addIssue({
        type: "syntax",
        severity: "critical",
        key: error.key,
        side,
        line: error.line,
        detail: `${error.message} (line ${error.line}, ${label}).`,
        suggestion: "Check the assignment and quote syntax on this line.",
      });
    }
    for (const duplicate of parsed.duplicates) {
      addIssue({
        type: "duplicate",
        severity: "warning",
        key: duplicate.key,
        side,
        line: duplicate.lines[0] ?? null,
        detail: `Declared ${duplicate.lines.length} times on lines ${duplicate.lines.join(", ")} in ${label}; the last declaration takes effect.`,
        suggestion: "Keep one declaration so the active value is unambiguous.",
      });
    }
    for (const entry of parsed.entries) {
      if (entry.value.length === 0) {
        addIssue({
          type: "empty",
          severity: "warning",
          key: entry.key,
          side,
          line: entry.line,
          detail: `This variable has an empty value in ${label}.`,
          suggestion: "Add a value, or confirm that an empty value is intentional.",
        });
      }
    }
  };

  addFileIssues(left, "left");
  addFileIssues(right, "right");

  const leftValues = lastValues(left);
  const rightValues = lastValues(right);
  const keys = new Set([...leftValues.keys(), ...rightValues.keys()]);

  for (const key of keys) {
    const leftEntry = leftValues.get(key);
    const rightEntry = rightValues.get(key);

    if (leftEntry && !rightEntry) {
      const issueSide: EnvSide = options.mode === "template" ? "left" : "right";
      const absentLabel = compareValueLabel(options.mode, issueSide, options.leftLabel, options.rightLabel);
      addIssue({
        type: options.mode === "template" ? "extra" : "missing",
        severity: "warning",
        key,
        side: issueSide,
        line: leftEntry.line,
        detail: options.mode === "template"
          ? `Present in the actual file but absent from the template.`
          : `Present in ${options.leftLabel} but missing from ${absentLabel}.`,
        suggestion: options.mode === "template"
          ? "Add this key to the template, or remove it from the actual file."
          : `Add the key to ${absentLabel} if both environments should match.`,
      });
      continue;
    }

    if (!leftEntry && rightEntry) {
      const issueSide: EnvSide = options.mode === "template" ? "left" : "right";
      const absentLabel = compareValueLabel(options.mode, issueSide, options.leftLabel, options.rightLabel);
      addIssue({
        type: options.mode === "template" ? "missing" : "extra",
        severity: "warning",
        key,
        side: issueSide,
        line: rightEntry.line,
        detail: options.mode === "template"
          ? `Required by the template but missing from the actual file.`
          : `Present in ${options.rightLabel} but missing from ${absentLabel}.`,
        suggestion: options.mode === "template"
          ? "Declare this variable in the actual file, even if its value is intentionally blank."
          : `Add the key to ${absentLabel} if both environments should match.`,
      });
      continue;
    }

    if (leftEntry && rightEntry && leftEntry.value !== rightEntry.value) {
      addIssue({
        type: "different",
        severity: "info",
        key,
        side: null,
        line: null,
        detail: `The values differ between ${compareValueLabel(options.mode, "left", options.leftLabel, options.rightLabel)} and ${compareValueLabel(options.mode, "right", options.leftLabel, options.rightLabel)}.`,
        suggestion: "Confirm this difference is expected for these configurations.",
      });
    }
  }

  issues.sort((first, second) => {
    const severityDifference = severityRank[first.severity] - severityRank[second.severity];
    if (severityDifference !== 0) return severityDifference;
    const keyDifference = (first.key ?? "").localeCompare(second.key ?? "");
    return keyDifference || first.type.localeCompare(second.type) || (first.line ?? 0) - (second.line ?? 0);
  });

  return { mode: options.mode, leftLabel: options.leftLabel, rightLabel: options.rightLabel, left, right, issues };
}

export function buildExampleFile(parsed: ParsedEnv): string {
  const keys = Array.from(new Set(parsed.entries.map((entry) => entry.key)));
  return ["# Generated by EnvCheck. Values are intentionally omitted.", ...keys.map((key) => `${key}=`)].join("\n");
}

export function buildSafeReport(result: ComparisonResult) {
  const counts = result.issues.reduce(
    (summary, issue) => {
      summary.total += 1;
      summary[issue.severity] += 1;
      return summary;
    },
    { total: 0, critical: 0, warning: 0, info: 0 },
  );

  return {
    tool: "EnvCheck",
    mode: result.mode,
    environments: [result.leftLabel, result.rightLabel],
    summary: counts,
    issues: result.issues.map(({ type, severity, key, side, line, detail, suggestion }) => ({
      category: type,
      severity,
      key,
      side: side === "left" ? result.leftLabel : side === "right" ? result.rightLabel : null,
      line,
      detail,
      suggestion,
    })),
  };
}

export function buildMarkdownReport(result: ComparisonResult): string {
  const report = buildSafeReport(result);
  const header = `# EnvCheck report\n\n${report.environments[0]} vs ${report.environments[1]} · ${report.summary.total} issue${report.summary.total === 1 ? "" : "s"}`;
  if (report.issues.length === 0) return `${header}\n\nNo configuration issues found.\n`;

  const rows = report.issues.map((issue) => {
    const key = issue.key ? `\`${issue.key.replaceAll("`", "\\`")}\`` : "—";
    const side = issue.side ? ` (${issue.side})` : "";
    return `| ${issue.severity} | ${issue.category} | ${key} | ${issue.detail}${side} | ${issue.suggestion} |`;
  });

  return `${header}\n\n| Severity | Category | Variable | Details | Suggestion |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`;
}