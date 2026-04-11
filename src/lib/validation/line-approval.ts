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

export const approvalBubbleTemplate = {
  pendingNew,
  pendingWaiting,
  approved,
  rejected,
};
