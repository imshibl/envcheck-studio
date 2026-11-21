import { describe, expect, it } from "vitest";

import { buildExampleFile, buildMarkdownReport, buildSafeReport, compareEnvFiles, parseEnv } from "@/lib/envcheck";

describe("dotenv parsing", () => {
  it("reads exports, comments, quoted values, inline comments, and colon assignments", () => {
    const parsed = parseEnv([
      "\uFEFF# local config",
      "export API_URL=https://example.test # endpoint",
      "TOKEN=alpha#not-a-comment",
      'MESSAGE="hello\\nworld # kept"',
      "LABEL: staging",
      "EMPTY=",
    ].join("\n"));

    expect(parsed.entries.map(({ key }) => key)).toEqual(["API_URL", "TOKEN", "MESSAGE", "LABEL", "EMPTY"]);
    expect(parsed.entries[0]?.value).toBe("https://example.test");
    expect(parsed.entries[1]?.value).toBe("alpha#not-a-comment");
    expect(parsed.entries[2]?.value).toBe("hello\nworld # kept");
    expect(parsed.entries[3]?.value).toBe("staging");
    expect(parsed.entries[4]?.value).toBe("");
    expect(parsed.errors).toEqual([]);
  });

  it("flags malformed lines, unclosed quotes, and duplicate declarations by line", () => {
    const parsed = parseEnv("DUP=first\nBROKEN\nDUP=second\nUNCLOSED=\"secret");

    expect(parsed.errors.map(({ line }) => line)).toEqual([2, 4]);
    expect(parsed.duplicates).toEqual([{ key: "DUP", lines: [1, 3] }]);
  });

  it("reads multiline quoted values without treating their lines as assignments", () => {
    const parsed = parseEnv('CERT="line one\nline two"\nPORT=8080');

    expect(parsed.entries.map(({ key }) => key)).toEqual(["CERT", "PORT"]);
    expect(parsed.entries[0]?.value).toBe("line one\nline two");
    expect(parsed.entries[1]?.line).toBe(3);
  });
});

describe("comparison and safe exports", () => {
  it("reports missing, extra, different, empty, duplicate, and syntax issues without values", () => {
    const privateValue = "private-token-do-not-export";
    const result = compareEnvFiles(
      `SHARED=${privateValue}\nMISSING=here\nEMPTY=\nDUP=first\nDUP=second\nBROKEN`,
      "SHARED=other\nEXTRA=here",
      { mode: "environments", leftLabel: "Development", rightLabel: "Staging" },
    );
    const categories = result.issues.map(({ type }) => type);
    const serialized = JSON.stringify(buildSafeReport(result));
    const markdown = buildMarkdownReport(result);

    expect(categories).toContain("missing");
    expect(categories).toContain("extra");
    expect(categories).toContain("different");
    expect(categories).toContain("empty");
    expect(categories).toContain("duplicate");
    expect(categories).toContain("syntax");
    expect(serialized).not.toContain(privateValue);
    expect(markdown).not.toContain(privateValue);
  });

  it("treats template-only keys as missing and actual-only keys as extra", () => {
    const result = compareEnvFiles("LOCAL_ONLY=1", "REQUIRED=", {
      mode: "template",
      leftLabel: "Actual .env",
      rightLabel: ".env.example",
    });

    expect(result.issues.find(({ key }) => key === "REQUIRED")?.type).toBe("missing");
    expect(result.issues.find(({ key }) => key === "LOCAL_ONLY")?.type).toBe("extra");
  });

  it("generates a value-free example file", () => {
    const actual = parseEnv("API_KEY=private-token-do-not-export\nPORT=3000\nAPI_KEY=second-secret");
    const example = buildExampleFile(actual);

    expect(example).toContain("API_KEY=");
    expect(example).toContain("PORT=");
    expect(example.match(/^API_KEY=$/gm)).toHaveLength(1);
    expect(example).not.toContain("private-token-do-not-export");
    expect(example).not.toContain("second-secret");
  });
});