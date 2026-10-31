import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PokerApiError,
  fetchRoomState,
  joinRoomRequest,
  sendRoomAction,
} from "../lib/api";
import type { RoomAction } from "../lib/schemas";
import {
  clearRoomToken,
  loadRoomToken,
  saveName,
  saveRoomToken,
} from "../lib/storage";
import type { PublicRoom } from "../types";

const POLL_INTERVAL_MS = 1500;

type RoomActionInput = Exclude<RoomAction, { type: "join" }>;

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong — please try again";

/**
 * optimistic vote — แก้ myVote + การ์ดของตัวเองใน cache ทันทีที่กด ให้เดค/พัดตอบสนองสมูฟ
 * (votedCount หน้า derive จาก voters เอง จึงไม่ต้องแตะ) — server ตอบกลับมาทับด้วยค่าจริงเสมอ
 * server ปัดทิ้ง (เช่น revealed) → act ย้อน snapshot ให้
 */
const applyOptimisticVote = (
  room: PublicRoom,
  value: string | null,
): PublicRoom => ({
  ...room,
  myVote: value,
  participants: room.participants.map((participant) =>
    participant.isYou
      ? { ...participant, vote: value, hasVoted: value !== null }
      : participant,
  ),
});

export const usePokerRoom = (code: string) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // กันส่งซ้ำระหว่างรอ server โดยไม่ต้อง disable ปุ่ม (disable ทำให้โฟกัสคีย์บอร์ดหลุด)
  const inFlight = useRef(false);

  // อ่าน token ใน effect เพื่อไม่ให้ SSR กับ client ไม่ตรงกัน (hydration)
  useEffect(() => {
    setToken(loadRoomToken(code));
    setIsTokenLoaded(true);
    setActionError(null);
  }, [code]);

  const queryKey = ["poker-room", code, token] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRoomState(code, token),
    enabled: isTokenLoaded,
    // หยุด poll ระหว่างมี action ค้าง — กันผล poll ที่คำนวณก่อน vote ถึง server
    // ทับ optimistic state กลับไปก่อนแล้วเด้งกลับอีกที (กะพริบ)
    refetchInterval: isBusy ? false : POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: (failureCount, error) =>
      !(error instanceof PokerApiError && error.status === 404) &&
      failureCount < 3,
  });

  const room = query.data;
  const isNotFound =
    query.error instanceof PokerApiError && query.error.status === 404;

  // token ใช้ไม่ได้แล้ว (ห้อง restart / ถูกเอาออกเพราะหายไปนาน) → กลับไปหน้า join
  useEffect(() => {
    if (room && token && room.meId === null) {
      clearRoomToken(code);
      setToken(null);
    }
  }, [room, token, code]);

  const run = useCallback(
    async <T>(task: () => Promise<T>): Promise<T | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setIsBusy(true);
      setActionError(null);
      try {
        return await task();
      } catch (error) {
        setActionError(toMessage(error));
        if (error instanceof PokerApiError && error.status === 401) {
          clearRoomToken(code);
          setToken(null);
        }
        return null;
      } finally {
        inFlight.current = false;
        setIsBusy(false);
      }
    },
    [code],
  );

  const join = useCallback(
    (name: string, role: "voter" | "spectator") =>
      run(async () => {
        const joined = await joinRoomRequest(code, { name, role });
        saveRoomToken(code, joined.token);
        saveName(name);
        queryClient.setQueryData(
          ["poker-room", code, joined.token],
          joined.room,
        );
        setToken(joined.token);
        return joined.room;
      }),
    [code, queryClient, run],
  );

  const act = useCallback(
    (
      action: RoomActionInput,
      optimistic?: (room: PublicRoom) => PublicRoom,
    ) =>
      run(async () => {
        const key = ["poker-room", code, token] as const;
        const snapshot = queryClient.getQueryData<PublicRoom>(key);
        // optimistic: แก้ cache ทันทีที่กด ให้ UI ตอบสนองสมูฟ ไม่ต้องรอ round trip
        if (optimistic && snapshot)
          queryClient.setQueryData<PublicRoom>(key, optimistic(snapshot));
        try {
          const next = await sendRoomAction(code, token, action);
          if (next) queryClient.setQueryData<PublicRoom>(key, next);
          return next;
        } catch (error) {
          // server ปัดทิ้ง → ย้อน optimistic ทันที (รอ poll แก้จะกะพริบกลับช้า 1.5s)
          if (optimistic && snapshot)
            queryClient.setQueryData<PublicRoom>(key, snapshot);
          throw error;
        }
      }),
    [code, token, queryClient, run],
  );

  const leave = useCallback(async () => {
    await run(() => sendRoomAction(code, token, { type: "leave" }));
    clearRoomToken(code);
    setToken(null);
  }, [code, token, run]);

  return {
    room,
    isLoading: !isTokenLoaded || query.isPending,
    isNotFound,
    loadError:
      !room && !isNotFound && query.isError ? toMessage(query.error) : null,
    actionError,
    isBusy,
    join,
    vote: (value: string | null) =>
      act({ type: "vote", value }, (room) => applyOptimisticVote(room, value)),
    reveal: () => act({ type: "reveal" }),
    reset: () => act({ type: "reset" }),
    setStory: (story: string) => act({ type: "story", story }),
    setRole: (role: "voter" | "spectator") => act({ type: "role", role }),
    rename: async (name: string) => {
      const next = await act({ type: "rename", name });
      if (next) saveName(name);
      return next;
    },
    leave,
  };
};
