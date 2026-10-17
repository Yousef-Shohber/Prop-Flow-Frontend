import { describe, expect, it } from "vitest";
import { makeSchemas } from "./schemas";

// identity translator: the key itself is the message, so assertions stay language-independent
const s = makeSchemas(((k: string) => k) as never);

const unit = {
  unitNumber: "A1",
  area: "80",
  rentAmount: "5000",
  bedrooms: "2",
  bathrooms: "1",
  floor: "",
  description: "",
};
const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.message);

describe("phone (backend: /^\\+?[0-9 ()-]{7,20}$/)", () => {
  const base = { firstName: "A", lastName: "B", email: "a@b.co", password: "12345678", role: "TENANT" as const };
  it.each(["", "+20 100 123 4567", "0100-123-4567", "(02) 2345678"])("accepts %j", (phone) => {
    expect(s.register.safeParse({ ...base, phone }).success).toBe(true);
  });
  it.each(["abc", "123", "+20 100 123 4567 8901 234", "010 1234 56x"])("rejects %j", (phone) => {
    expect(messages(s.register.safeParse({ ...base, phone }))).toContain("v.phone");
  });
  it("is optional", () => {
    expect(s.register.safeParse(base).success).toBe(true);
  });
  it("profile uses the same rule", () => {
    expect(s.profile.safeParse({ firstName: "A", lastName: "B", phone: "xx" }).success).toBe(false);
  });
});

describe("unit limits (backend: bedrooms/bathrooms 0-50, floor -2..200, rent <= 2e9)", () => {
  it("accepts the limits", () => {
    expect(s.unit.safeParse({ ...unit, bedrooms: "50", bathrooms: "0", floor: "-2", rentAmount: "2000000000" }).success).toBe(true);
    expect(s.unit.safeParse({ ...unit, floor: "200" }).success).toBe(true);
  });
  it("rejects values the API would answer with 400", () => {
    expect(messages(s.unit.safeParse({ ...unit, bedrooms: "51" }))).toContain("v.rooms");
    expect(messages(s.unit.safeParse({ ...unit, bathrooms: "99" }))).toContain("v.rooms");
    expect(messages(s.unit.safeParse({ ...unit, floor: "201" }))).toContain("v.floor");
    expect(messages(s.unit.safeParse({ ...unit, floor: "-3" }))).toContain("v.floor");
    expect(messages(s.unit.safeParse({ ...unit, rentAmount: "2000000001" }))).toContain("v.rent");
    expect(messages(s.unit.safeParse({ ...unit, area: "10000" }))).toContain("v.area");
  });
});

describe("dates", () => {
  it("requires end after start", () => {
    const r = s.rentalRequest.safeParse({ startDate: "2099-02-01", endDate: "2099-01-01" });
    expect(messages(r)).toContain("v.endAfter");
  });
  it("renewal must be after the current end date", () => {
    const r = s.renewal("2099-06-30").safeParse({ endDate: "2099-06-30" });
    expect(r.success).toBe(false);
    expect(s.renewal("2099-06-30").safeParse({ endDate: "2099-07-01" }).success).toBe(true);
  });
});
