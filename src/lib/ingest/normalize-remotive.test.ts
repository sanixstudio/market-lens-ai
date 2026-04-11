import { describe, expect, it } from "vitest";
import {
  inferSpecialtyFromTitle,
  normalizeRemotiveJob,
  parseSalaryToWeeklyUsd,
  resolveRemoteRegionId,
} from "./normalize-remotive";
import type { RemotiveJob } from "./remotive.types";

describe("resolveRemoteRegionId", () => {
  it("routes US strings to reg_remote_us", () => {
    expect(resolveRemoteRegionId("United States")).toBe("reg_remote_us");
    expect(resolveRemoteRegionId("USA only")).toBe("reg_remote_us");
    expect(resolveRemoteRegionId("US time zones")).toBe("reg_remote_us");
  });

  it("routes worldwide to global", () => {
    expect(resolveRemoteRegionId("Worldwide")).toBe("reg_remote_global");
    expect(resolveRemoteRegionId("")).toBe("reg_remote_global");
    expect(resolveRemoteRegionId(null)).toBe("reg_remote_global");
  });
});

describe("inferSpecialtyFromTitle", () => {
  it("classifies tracks", () => {
    expect(inferSpecialtyFromTitle("Staff Software Engineer")).toBe("Software Engineer");
    expect(inferSpecialtyFromTitle("Senior ML Engineer")).toBe("Data & ML");
    expect(inferSpecialtyFromTitle("DevOps Engineer")).toBe("DevOps / SRE");
  });
});

describe("parseSalaryToWeeklyUsd", () => {
  it("parses annual ranges to weekly", () => {
    const w = parseSalaryToWeeklyUsd("$100,000 - $120,000");
    expect(w).toBe(Math.round(110_000 / 52));
  });

  it("returns null when missing", () => {
    expect(parseSalaryToWeeklyUsd(null)).toBeNull();
    expect(parseSalaryToWeeklyUsd("")).toBeNull();
  });
});

describe("normalizeRemotiveJob", () => {
  it("produces stable ids and sourceId", () => {
    const job: RemotiveJob = {
      id: 42,
      url: "https://remotive.com/remote-jobs/example-42",
      title: "Backend Engineer",
      company_name: "Acme",
      publication_date: "2024-06-01T12:00:00",
      candidate_required_location: "Worldwide",
      salary: "$80,000 - $100,000",
    };
    const n = normalizeRemotiveJob(job);
    expect(n.sourceId).toBe("remotive:42");
    expect(n.id).toBe("job_remotive_42");
    expect(n.regionId).toBe("reg_remote_global");
    expect(n.grossWeeklyPay).toBe(Math.round(90_000 / 52));
  });
});
