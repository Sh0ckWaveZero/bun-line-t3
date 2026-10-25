import { POKER_TOKEN_HEADER } from "../constants";
import type { JoinedRoomResponse, PublicRoom } from "../types";
import type { CreateRoomInput, RoomAction } from "./schemas";

export class PokerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PokerApiError";
  }
}

export const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as
    (T & { error?: string }) | null;
  if (!response.ok) {
    throw new PokerApiError(
      payload?.error ?? "Something went wrong — please try again",
      response.status,
    );
  }
  return payload as T;
};

const tokenHeaders = (token: string | null): Record<string, string> =>
  token ? { [POKER_TOKEN_HEADER]: token } : {};

export const createRoomRequest = async (
  input: Omit<
    CreateRoomInput,
    "deckId" | "customDeck" | "observersCanControl"
  > & {
    deckId: string;
  } & Partial<Pick<CreateRoomInput, "customDeck" | "observersCanControl">>,
): Promise<JoinedRoomResponse> =>
  parseJson<JoinedRoomResponse>(
    await fetch("/api/poker/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

export const fetchRoomState = async (
  code: string,
  token: string | null,
): Promise<PublicRoom> =>
  parseJson<PublicRoom>(
    await fetch(`/api/poker/rooms/${code}`, {
      headers: tokenHeaders(token),
      cache: "no-store",
    }),
  );

export const joinRoomRequest = async (
  code: string,
  input: { name: string; role: "voter" | "spectator" },
): Promise<JoinedRoomResponse> =>
  parseJson<JoinedRoomResponse>(
    await fetch(`/api/poker/rooms/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "join", ...input }),
    }),
  );

export const sendRoomAction = async (
  code: string,
  token: string | null,
  action: Exclude<RoomAction, { type: "join" }>,
): Promise<PublicRoom | null> =>
  parseJson<PublicRoom | null>(
    await fetch(`/api/poker/rooms/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeaders(token) },
      body: JSON.stringify(action),
    }),
  );
