import { describe, it, expect } from "vitest"
import { buildSprintJql, sanitizeProjectKey, toJiraIssue, parseIssueKey } from "../lib/jira"

describe("buildSprintJql", () => {
  it("targets open sprints, excludes done", () => {
    const jql = buildSprintJql("pdc")
    expect(jql).toContain("project = PDC")
    expect(jql).toContain("openSprints()")
    expect(jql).toContain("statusCategory != Done")
  })
})

describe("sanitizeProjectKey", () => {
  it("uppercases valid keys", () => {
    expect(sanitizeProjectKey(" pdc ")).toBe("PDC")
  })
  it("rejects injection and garbage", () => {
    expect(sanitizeProjectKey("PDC OR 1=1")).toBeNull()
    expect(sanitizeProjectKey("")).toBeNull()
    expect(sanitizeProjectKey("a")).toBeNull()
  })
})

describe("toJiraIssue", () => {  it("maps fields with fallbacks", () => {
    const issue = toJiraIssue("https://x.atlassian.net", { key: "PDC-1", fields: { summary: "S", status: { name: "To Do" }, issuetype: { name: "Story" }, assignee: null } })
    expect(issue).toEqual({ key: "PDC-1", summary: "S", status: "To Do", type: "Story", assignee: null, url: "https://x.atlassian.net/browse/PDC-1" })
  })
})

describe("parseIssueKey", () => {
  it("extracts keys from imported quest titles", () => {
    expect(parseIssueKey("PDC-1077 Define pipeline")).toBe("PDC-1077")
  })
  it("rejects manual titles", () => {
    expect(parseIssueKey("Zero flaky tests")).toBeNull()
    expect(parseIssueKey("pdc-1 lower")).toBeNull()
  })
})
