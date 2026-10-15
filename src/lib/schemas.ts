import { z } from "zod";
import { useMemo } from "react";
import { useI18n, type TFn } from "@/i18n";
import { addDaysISO, cmpDate, isValidISODate, todayISO } from "./dates";
import {
  MaintenanceCategory,
  MaintenancePriority,
  PropertyType,
} from "@/types/enums";

/** Validation lives in one place. Messages are translated; limits come from the backend spec. */
export function makeSchemas(t: TFn) {
  const req = z.string().trim().min(1, t("v.required"));
  const optional = (max: number) =>
    z
      .string()
      .trim()
      .max(max, t("v.max", { n: max }))
      .optional()
      .or(z.literal(""));
  const email = z
    .string()
    .trim()
    .min(1, t("v.required"))
    .email(t("v.email"))
    .max(255, t("v.max", { n: 255 }));
  const password = z.string().min(8, t("v.min8")).max(128, t("v.max128"));
  const intStr = (min: number, max: number, msg: string) =>
    z
      .string()
      .trim()
      .min(1, t("v.required"))
      .regex(/^\d+$/, t("v.whole"))
      .refine((v) => Number(v) >= min && Number(v) <= max, msg);
  const optIntStr = z
    .string()
    .trim()
    .regex(/^-?\d*$/, t("v.int"))
    .optional()
    .or(z.literal(""));
  const date = z
    .string()
    .min(1, t("v.required"))
    .refine(isValidISODate, t("v.date"));

  const dateRange = <T extends z.ZodRawShape>(shape: T) =>
    z
      .object({ ...shape, startDate: date, endDate: date })
      .superRefine((v: any, ctx) => {
        if (!isValidISODate(v.startDate) || !isValidISODate(v.endDate)) return;
        if (cmpDate(v.startDate, v.endDate) >= 0)
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: t("v.endAfter"),
          });
        else if (cmpDate(v.endDate, todayISO()) < 0)
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: t("v.endPast"),
          });
      });

  const unitFields = {
    unitNumber: req.max(50, t("v.max", { n: 50 })),
    floor: optIntStr,
    area: intStr(1, 9999, t("v.area")),
    rentAmount: z
      .string()
      .trim()
      .min(1, t("v.required"))
      .regex(/^\d+$/, t("v.whole")),
    bedrooms: intStr(0, 99, t("v.nonNeg")),
    bathrooms: intStr(0, 99, t("v.nonNeg")),
    description: optional(2000),
  };

  return {
    login: z.object({ email, password: z.string().min(1, t("v.required")) }),
    register: z.object({
      firstName: req.max(100, t("v.max", { n: 100 })),
      lastName: req.max(100, t("v.max", { n: 100 })),
      phone: optional(30),
      email,
      password,
      role: z.enum(["TENANT", "OWNER"]),
    }),
    verify: z.object({ email, otp: z.string().regex(/^\d{6}$/, t("v.otp")) }),
    forgot: z.object({ email }),
    reset: z
      .object({
        email,
        otp: z.string().regex(/^\d{6}$/, t("v.otp")),
        newPassword: password,
        confirm: z.string().min(1, t("v.required")),
      })
      .refine((v) => v.newPassword === v.confirm, {
        path: ["confirm"],
        message: t("v.match"),
      }),
    changePassword: z
      .object({
        currentPassword: z.string().min(1, t("v.required")),
        newPassword: password,
        confirm: z.string().min(1, t("v.required")),
      })
      .refine((v) => v.newPassword === v.confirm, {
        path: ["confirm"],
        message: t("v.match"),
      }),
    profile: z.object({
      firstName: req.max(100, t("v.max", { n: 100 })),
      lastName: req.max(100, t("v.max", { n: 100 })),
      phone: optional(30),
    }),
    property: z.object({
      name: req.max(150, t("v.max", { n: 150 })),
      description: optional(2000),
      propertyType: z.enum(PropertyType, { message: t("v.pickOne") }),
      address: req.max(255, t("v.max", { n: 255 })),
      city: req.max(100, t("v.max", { n: 100 })),
      country: optional(100),
    }),
    singleUnit: z.object({
      area: unitFields.area,
      rentAmount: unitFields.rentAmount,
      bedrooms: unitFields.bedrooms,
      bathrooms: unitFields.bathrooms,
      floor: unitFields.floor,
      description: unitFields.description,
    }),
    unit: z.object(unitFields),
    rentalRequest: dateRange({ message: optional(1000) }),
    lease: dateRange({ unitId: req, notes: optional(1000) }),
    leaseEdit: z
      .object({ startDate: date, endDate: date, notes: optional(1000) })
      .superRefine((v, ctx) => {
        if (!isValidISODate(v.startDate) || !isValidISODate(v.endDate)) return;
        if (cmpDate(v.startDate, v.endDate) >= 0)
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: t("v.endAfter"),
          });
        else if (cmpDate(v.endDate, todayISO()) < 0)
          ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: t("v.endPast"),
          });
      }),
    renewal: (currentEnd: string) =>
      z
        .object({ endDate: date, message: optional(1000) })
        .superRefine((v, ctx) => {
          if (
            isValidISODate(v.endDate) &&
            cmpDate(v.endDate, addDaysISO(currentEnd, 1)) < 0
          )
            ctx.addIssue({
              code: "custom",
              path: ["endDate"],
              message: t("v.minAfter", { date: currentEnd }),
            });
        }),
    maintenance: z.object({
      unitId: req,
      title: req.max(150, t("v.max", { n: 150 })),
      description: req.max(2000, t("v.max", { n: 2000 })),
      category: z.enum(MaintenanceCategory),
      priority: z.enum(MaintenancePriority),
    }),
    assign: z.object({
      scheduledDate: z.string().optional().or(z.literal("")),
      notes: optional(1000),
    }),
    complete: z.object({
      resolutionDescription: req.max(2000, t("v.max", { n: 2000 })),
      notes: optional(1000),
    }),
    notes: z.object({ notes: optional(1000) }),
  };
}
export type Schemas = ReturnType<typeof makeSchemas>;

export function useSchemas(): Schemas {
  const { t, lang } = useI18n();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeSchemas(t), [lang]);
}

/** Password strength (client hint only): length + variety. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[a-z\u0600-\u06FF]/.test(pw) && /[A-Z0-9]/.test(pw)) score++;
  if (
    /[^A-Za-z0-9\u0600-\u06FF]/.test(pw) ||
    (/\d/.test(pw) && /[A-Za-z]/.test(pw) && pw.length >= 10)
  )
    score++;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}
