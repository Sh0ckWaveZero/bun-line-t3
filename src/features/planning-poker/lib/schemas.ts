import { z } from "zod";
import {
  CUSTOM_DECK_ID,
  CUSTOM_DECK_LIMITS,
  DECK_IDS,
  POKER_LIMITS,
} from "../constants";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Please enter a name")
  .max(
    POKER_LIMITS.nameMaxLength,
    `Name must be at most ${POKER_LIMITS.nameMaxLength} characters`,
  );

const storySchema = z
  .string()
  .trim()
  .max(
    POKER_LIMITS.storyMaxLength,
    `Story must be at most ${POKER_LIMITS.storyMaxLength} characters`,
  );

const roleSchema = z.enum(["voter", "spectator"]);

const customDeckSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(
        CUSTOM_DECK_LIMITS.valueMaxLength,
        `Card values must be at most ${CUSTOM_DECK_LIMITS.valueMaxLength} characters`,
      ),
  )
  .min(
    CUSTOM_DECK_LIMITS.minValues,
    `A deck needs at least ${CUSTOM_DECK_LIMITS.minValues} cards`,
  )
  .max(
    CUSTOM_DECK_LIMITS.maxValues,
    `A deck can have at most ${CUSTOM_DECK_LIMITS.maxValues} cards`,
  )
  .refine((values) => new Set(values).size === values.length, {
    message: "Duplicate card values",
  });

export const createRoomSchema = z
  .object({
    name: nameSchema,
    deckId: z.enum([...DECK_IDS, CUSTOM_DECK_ID]),
    customDeck: customDeckSchema.optional(),
    role: roleSchema.default("voter"),
    story: storySchema.default(""),
    observersCanControl: z.boolean().default(true),
  })
  .strict()
  .refine((input) => input.deckId !== CUSTOM_DECK_ID || input.customDeck, {
    message: "Please provide values for the custom deck",
    path: ["customDeck"],
  });


/** ผู้รับเชิญ (client) — อีเมลเข้ม ห้าม whitespace/URI metachar กันแทรกพารามิเตอร์ mailto */
export const inviteRecipientsSchema = z
  .array(z.string().trim().email().max(254))
  .min(1)
  .max(20);

export const roomActionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("join"),
      name: nameSchema,
      role: roleSchema.default("voter"),
    })
    .strict(),
  z
    .object({
      type: z.literal("vote"),
      value: z.string().min(1).max(8).nullable(),
    })
    .strict(),
  z.object({ type: z.literal("reveal") }).strict(),
  z.object({ type: z.literal("reset") }).strict(),
  z.object({ type: z.literal("story"), story: storySchema }).strict(),
  z.object({ type: z.literal("rename"), name: nameSchema }).strict(),
  z.object({ type: z.literal("role"), role: roleSchema }).strict(),
  z.object({ type: z.literal("leave") }).strict(),
]);

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RoomAction = z.infer<typeof roomActionSchema>;
