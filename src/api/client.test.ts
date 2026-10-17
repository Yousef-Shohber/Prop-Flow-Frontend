import { describe, expect, it } from "vitest";
import { qs, toFormData } from "./client";

describe("qs", () => {
  it("drops empty values and sends booleans as strings (forbidNonWhitelisted + @Transform)", () => {
    expect(qs({ page: 1, search: "", status: undefined, unread: true, isActive: false, city: null })).toEqual({
      page: 1,
      unread: "true",
      isActive: "false",
    });
  });
});

describe("toFormData", () => {
  it("appends fields and repeated file parts with the field names the backend interceptors expect", () => {
    const a = new File(["a"], "a.png", { type: "image/png" });
    const b = new File(["b"], "b.png", { type: "image/png" });
    const fd = toFormData({ title: "Leak", skip: undefined }, { images: [a, b] });
    expect(fd.get("title")).toBe("Leak");
    expect(fd.has("skip")).toBe(false);
    expect(fd.getAll("images")).toHaveLength(2);
  });
});
