/**
 * LINE Flex Message Bubble Templates สำหรับ Approval Flow
 * รองรับ: แจ้งเตือนรอการอนุมัติ, อนุมัติแล้ว, ถูกปฏิเสธ
 */

const GRADIENT_PENDING = {
  type: "linearGradient",
  angle: "135deg",
  startColor: "#f59e0b",
  endColor: "#d97706",
};

const GRADIENT_APPROVED = {
  type: "linearGradient",
  angle: "135deg",
  startColor: "#10b981",
  endColor: "#059669",
};

const GRADIENT_REJECTED = {
  type: "linearGradient",
  angle: "135deg",
  startColor: "#ef4444",
  endColor: "#dc2626",
};

const GRADIENT_ADMIN = {
  type: "linearGradient",
  angle: "135deg",
  startColor: "#6366f1",
  endColor: "#4338ca",
};

/**
 * ส่งให้ user ครั้งแรก — รอการอนุมัติ (NEW)
 */
const pendingNew = () => {
  return [
    {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: GRADIENT_PENDING,
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⏳",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                paddingStart: "12px",
                contents: [
                  {
                    type: "text",
                    text: "คำขอใช้งานถูกส่งแล้ว",
                    color: "#ffffff",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "Bun LINE T3",
                    color: "#fef3c7",
                    size: "sm",
                  },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "สวัสดีครับ! 👋",
            weight: "bold",
            size: "md",
            color: "#1f2937",
          },
          {
            type: "text",
            text: "ระบบได้รับคำขอใช้งานของคุณเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบตรวจสอบและอนุมัติก่อนจึงจะสามารถใช้งานคำสั่งต่าง ๆ ได้",
            wrap: true,
            size: "sm",
            color: "#4b5563",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "สถานะ",
                    size: "sm",
                    color: "#6b7280",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: "🟡 รอการอนุมัติ",
                    size: "sm",
                    color: "#d97706",
                    weight: "bold",
                    flex: 3,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ระยะเวลา",
                    size: "sm",
                    color: "#6b7280",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: "ภายใน 1-3 วันทำการ",
                    size: "sm",
                    color: "#374151",
                    flex: 3,
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: "เมื่อได้รับการอนุมัติ ระบบจะแจ้งเตือนท่านทันทีผ่านข้อความนี้",
            wrap: true,
            size: "xs",
            color: "#9ca3af",
            margin: "lg",
          },
        ],
      },
    },
  ];
};

/**
 * ส่งเมื่อ user ที่ยังรอ พิมพ์คำสั่งมาอีก
 */
const pendingWaiting = () => {
  return [
    {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: GRADIENT_PENDING,
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⏳",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                paddingStart: "12px",
                contents: [
                  {
                    type: "text",
                    text: "ยังรอการอนุมัติ",
                    color: "#ffffff",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "Bun LINE T3",
                    color: "#fef3c7",
                    size: "sm",
                  },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "คำขอของท่านยังอยู่ระหว่างการพิจารณา กรุณารอผู้ดูแลระบบอนุมัติก่อนนะครับ 🙏",
            wrap: true,
            size: "sm",
            color: "#4b5563",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            backgroundColor: "#fef3c7",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "💡 เมื่อได้รับการอนุมัติแล้ว ท่านสามารถใช้คำสั่งได้ทันที",
                wrap: true,
                size: "xs",
                color: "#92400e",
              },
            ],
          },
        ],
      },
    },
  ];
};

/**
 * ส่งเมื่อ admin อนุมัติแล้ว
 */
const approved = (displayName?: string | null) => {
  const name = displayName ?? "ผู้ใช้งาน";

  return [
    {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: GRADIENT_APPROVED,
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "✅",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                paddingStart: "12px",
                contents: [
                  {
                    type: "text",
                    text: "อนุมัติการใช้งานแล้ว!",
                    color: "#ffffff",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "Bun LINE T3",
                    color: "#d1fae5",
                    size: "sm",
                  },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `ยินดีต้อนรับ ${name}! 🎉`,
            weight: "bold",
            size: "md",
            color: "#1f2937",
          },
          {
            type: "text",
            text: "บัญชีของท่านได้รับการอนุมัติแล้ว สามารถใช้งานคำสั่งต่าง ๆ ได้ทันที",
            wrap: true,
            size: "sm",
            color: "#4b5563",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "คำสั่งพื้นฐาน",
            weight: "bold",
            size: "sm",
            color: "#374151",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "/help",
                    size: "sm",
                    color: "#059669",
                    weight: "bold",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: "— ดูคำสั่งทั้งหมด",
                    size: "sm",
                    color: "#6b7280",
                    flex: 2,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "/checkin",
                    size: "sm",
                    color: "#059669",
                    weight: "bold",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: "— ลงเวลาเข้างาน",
                    size: "sm",
                    color: "#6b7280",
                    flex: 2,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "/status",
                    size: "sm",
                    color: "#059669",
                    weight: "bold",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: "— ดูสถานะปัจจุบัน",
                    size: "sm",
                    color: "#6b7280",
                    flex: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];
};

/**
 * ส่งเมื่อ admin ปฏิเสธ
 */
const rejected = (rejectReason?: string | null) => {
  return [
    {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: GRADIENT_REJECTED,
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "❌",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                paddingStart: "12px",
                contents: [
                  {
                    type: "text",
                    text: "ไม่ได้รับการอนุมัติ",
                    color: "#ffffff",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "Bun LINE T3",
                    color: "#fee2e2",
                    size: "sm",
                  },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ขออภัย คำขอใช้งานของท่านไม่ได้รับการอนุมัติในครั้งนี้",
            wrap: true,
            size: "sm",
            color: "#4b5563",
          },
          ...(rejectReason
            ? [
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  backgroundColor: "#fee2e2",
                  cornerRadius: "8px",
                  paddingAll: "12px",
                  contents: [
                    {
                      type: "text",
                      text: "เหตุผล",
                      size: "xs",
                      weight: "bold",
                      color: "#991b1b",
                    },
                    {
                      type: "text",
                      text: rejectReason,
                      wrap: true,
                      size: "sm",
                      color: "#dc2626",
                      margin: "sm",
                    },
                  ],
                },
              ]
            : []),
          {
            type: "text",
            text: "หากต้องการสอบถามเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบโดยตรง",
            wrap: true,
            size: "xs",
            color: "#9ca3af",
            margin: "lg",
          },
        ],
      },
    },
  ];
};

interface AdminPendingRequestParams {
  displayName?: string | null;
  pictureUrl?: string | null;
  lineUserId: string;
  statusMessage?: string | null;
  pendingCount: number;
  webUrl: string;
}

/**
 * ส่งให้แอดมิน — มีคำขอใหม่รออนุมัติ พร้อมข้อมูลผู้ขอและปุ่มอนุมัติใน LINE
 * (ปฏิเสธให้ทำบนเว็บ เพื่อระบุเหตุผลได้ครบถ้วน)
 */
const adminPendingRequest = (params: AdminPendingRequestParams) => {
  const {
    displayName,
    pictureUrl,
    lineUserId,
    statusMessage,
    pendingCount,
    webUrl,
  } = params;

  const name = displayName?.trim() || "ผู้ใช้งานใหม่";
  const timeText = new Date().toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const infoRow = (label: string, value: string, valueColor = "#374151") => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#6b7280", flex: 3 },
      {
        type: "text",
        text: value,
        size: "sm",
        color: valueColor,
        weight: "bold",
        flex: 5,
        wrap: true,
      },
    ],
  });

  return [
    {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: GRADIENT_ADMIN,
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "🔔",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                paddingStart: "12px",
                contents: [
                  {
                    type: "text",
                    text: "มีคำขอใหม่รออนุมัติ",
                    color: "#ffffff",
                    weight: "bold",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "ต้องการการตรวจสอบจากแอดมิน",
                    color: "#e0e7ff",
                    size: "sm",
                  },
                ],
              },
            ],
          },
        ],
      },
      ...(pictureUrl
        ? {
            hero: {
              type: "image",
              url: pictureUrl,
              size: "full",
              aspectRatio: "20:13",
              aspectMode: "cover",
              backgroundColor: "#f3f4f6",
            },
          }
        : {}),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: name,
            weight: "bold",
            size: "xl",
            color: "#111827",
          },
          ...(statusMessage?.trim()
            ? [
                {
                  type: "text",
                  text: statusMessage,
                  wrap: true,
                  size: "xs",
                  color: "#6b7280",
                  margin: "sm",
                },
              ]
            : []),
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              infoRow("สถานะ", "🟡 รอการอนุมัติ", "#d97706"),
              infoRow("คำขอค้างทั้งหมด", `${pendingCount} รายการ`),
              infoRow("เวลาที่ขอ", timeText),
              infoRow("LINE User ID", lineUserId, "#9ca3af"),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#059669",
            height: "md",
            action: {
              type: "postback",
              label: "✅ อนุมัติ",
              data: `action=admin_approve&uid=${lineUserId}`,
              displayText: `อนุมัติ ${name}`,
            },
          },
          {
            type: "button",
            style: "link",
            height: "md",
            action: {
              type: "uri",
              label: "ดูรายละเอียด / ปฏิเสธบนเว็บ",
              uri: webUrl,
            },
          },
        ],
      },
    },
  ];
};

/**
 * ส่งให้แอดมิน — ผลการกดปุ่มอนุมัติใน LINE
 */
const adminApproveResult = (params: { ok: boolean; message: string }) => {
  const { ok, message } = params;

  return [
    {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        background: ok ? GRADIENT_APPROVED : GRADIENT_REJECTED,
        contents: [
          {
            type: "text",
            text: ok ? "✅ อนุมัติสำเร็จ" : "⚠️ ดำเนินการไม่สำเร็จ",
            color: "#ffffff",
            weight: "bold",
            size: "md",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: message,
            wrap: true,
            size: "sm",
            color: ok ? "#374151" : "#dc2626",
          },
        ],
      },
    },
  ];
};

export const approvalBubbleTemplate = {
  pendingNew,
  pendingWaiting,
  approved,
  rejected,
  adminPendingRequest,
  adminApproveResult,
};
