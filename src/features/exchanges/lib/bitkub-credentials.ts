import { z } from "zod";

const credentialSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกข้อมูลนี้")
  .max(512, "ข้อมูลต้องมีความยาวไม่เกิน 512 ตัวอักษร")
  .refine(
    (value) =>
      Array.from(value).every(
        (character) =>
          character.charCodeAt(0) > 32 && character.charCodeAt(0) !== 127,
      ),
    "ข้อมูลต้องไม่มีช่องว่างหรืออักขระควบคุม",
  );

export const bitkubCredentialsSchema = z.strictObject({
  apiKey: credentialSchema.max(
    256,
    "API key ต้องมีความยาวไม่เกิน 256 ตัวอักษร",
  ),
  apiSecret: credentialSchema,
});

export type BitkubCredentials = z.infer<typeof bitkubCredentialsSchema>;
