/**
 * LINE Messaging API Types
 * @see https://developers.line.biz/en/reference/messaging-api/
 */

export interface LineTextMessage {
  type: "text";
  text: string;
}

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: {
    type: "carousel" | "bubble";
    contents: Array<Record<string, unknown>>;
  };
}

export type LineMessage = LineTextMessage | LineFlexMessage;

export interface LinePushMessageRequest {
  to: string;
  messages: LineMessage[];
}

export interface LinePushMessageResponse {
  success: boolean;
  message: string;
  error?: string;
}

export type MessageType =
  | "checkin_menu"
  | "reminder"
  | "checkout_reminder"
  | "default";

export interface AttendancePushRequest {
  userId: string;
  messageType?: MessageType;
}
