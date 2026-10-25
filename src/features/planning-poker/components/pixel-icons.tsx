import type { SVGProps } from "react";

/** ไอคอน pixel ของ feature Planning Poker — ที่มา: Pixelarticons โดย Gerrit Halfmann
 *  (https://pixelarticons.com / MIT license — ใช้เชิงพาณิชย์ได้)
 *  ดึง path จาก Iconify (pixelarticons) แล้ววางในเครื่อง ไม่พึ่ง runtime
 *  ทุกตัว viewBox 24×24 fill currentColor + crispEdges ให้ขอบ pixel คม */
const makePixelIcon = (d: string) => {
  const Icon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={d} />
    </svg>
  );
  return Icon;
};

const PixelMonitor = makePixelIcon("M4 2h16v2H4zm0 14h16v2H4zM2 4h2v12H2zm18 0h2v12h-2zm-9 14h2v2h-2zm-3 2h8v2H8z");
const PixelDice = makePixelIcon("M5 3H3v18h18V3zm14 2v14H5V5zM9 7H7v2h2zm6 0h2v2h-2zm-6 8H7v2h2zm6 0h2v2h-2zm-2-4h-2v2h2z");
const PixelCheck = makePixelIcon("M10 18H8v-2h2zm-2-2H6v-2h2zm4-2v2h-2v-2zm-6 0H4v-2h2zm8 0h-2v-2h2zm2-2h-2v-2h2zm2-2h-2V8h2zm2-2h-2V6h2z");
const PixelClock = makePixelIcon("M6 2h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zM4 4h2v2H4zm2 18h12v-2H6zm12-2h2v-2h-2zM4 20h2v-2H4zm7-14h2v7h-2zm2 7h2v2h-2zm2 2h2v2h-2z");
const PixelChevronDown = makePixelIcon("M13 16h-2v-2h2zm-2-2H9v-2h2zm4 0h-2v-2h2zm-6-2H7v-2h2zm8 0h-2v-2h2zM7 10H5V8h2zm12 0h-2V8h2z");

const PixelCopy = makePixelIcon("M8 6h12v2H8zM4 2h12v2H4zm2 6h2v12H6zM2 4h2v12H2zm6 16h12v2H8zM20 8h2v12h-2zm-4-4h2v2h-2zM4 16h2v2H4z");
const PixelEdit = makePixelIcon("M18 2h-2v2h-2v2h-2v2h-2v2H8v2H6v2H4v2H2v6h6v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h-2V4h-2zm0 8h-2v2h-2v2h-2v2h-2v2H8v-2H6v-2h2v-2h2v-2h2V8h2V6h2v2h2zM6 16H4v4h4v-2H6z");
const PixelEye = makePixelIcon("M16 20H8v-2h8zm-8-2H4v-2h4zm12 0h-4v-2h4zM4 16H2v-2h2zm10-6h-2v2h2zh2v4h-2v2h-4v-2H8v-4h2V8h4zm8 6h-2v-2h2zM2 14H0v-4h2zm22 0h-2v-4h2zM4 10H2V8h2zm18 0h-2V8h2zM8 8H4V6h4zm12 0h-4V6h4zm-4-2H8V4h8z");
const PixelMail = makePixelIcon("M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z");
const PixelMinus = makePixelIcon("M4 11h16v2H4z");
const PixelPlus = makePixelIcon("M13 11h7v2h-7v7h-2v-7H4v-2h7V4h2z");
const PixelRefresh = makePixelIcon("M13 20H9v-2h4zm6-4h2v2h-2v2h-2v-2h-2v-2h2V8h2zM9 18H7v-2h2zM7 6h2v2H7v8H5V8H3V6h2V4h2zm8 10h-2v-2h2zm8 0h-2v-2h2zM3 10H1V8h2zm8 0H9V8h2zm6-2h-2V6h2zm-2-2h-4V4h4z");
const PixelShare = makePixelIcon("M20 22H4v-2h16zM4 20H2v-6h2zm18 0h-2v-6h2zM13 4h2v2h2v2h-4v10h-2V8H7V6h2V4h2V2h2zM9 14H4v-2h5zm11 0h-5v-2h5z");
const PixelCode = makePixelIcon("M11 18H9v-4h2zm-4-1H5v-2h2zm12-2v2h-2v-2zM5 15H3v-2h2zm16 0h-2v-2h2zm-8-1h-2v-4h2zM3 13H1v-2h2zm20 0h-2v-2h2zM5 11H3V9h2zm16 0h-2V9h2zm-6-1h-2V6h2zM7 9H5V7h2zm12 0h-2V7h2z");
const PixelGift = makePixelIcon("M4 6h16v2H4zM2 8h2v4H2zm2 4h16v2H4zm16-4h2v4h-2zM6 4h2v2H6zm2-2h3v2H8zm3 2h2v2h-2zm2-2h3v2h-3zm3 2h2v2h-2zM4 14h2v6H4zm2 6h12v2H6zm12-6h2v6h-2zm-7-6h2v4h-2zm0 6h2v6h-2z");
const PixelList = makePixelIcon("M6 6H4v2h2zm14 0H8v2h12zM4 11h2v2H4zm16 0H8v2h12zM4 16h2v2H4zm16 0H8v2h12z");
const PixelLogin = makePixelIcon("M21 15v4h-2v-4zm-2 4v2H5v-2zM5 15v4H3v-4zm8-12v14h-2V3z");
const PixelLogout = makePixelIcon("M19 21H5v-2h14zM5 19H3v-4h2zm16 0h-2v-4h2zM13 5h2v2h2v2h-4v8h-2V9H7V7h2V5h2V3h2z");
const PixelSwap = makePixelIcon("M18 20h-6v-2h6zm2-2h-2v-8h2zm-10-4H8v-2H6v-2H4V8h2V6h2V4h2v4h8v2h-8z");

export {
  PixelDice, PixelCode, PixelPlus, PixelCheck, PixelCopy, PixelEdit, PixelEye, PixelLogin, PixelClock, PixelChevronDown, PixelList, PixelGift, PixelMonitor, PixelSwap, PixelLogout, PixelMail, PixelMinus, PixelRefresh, PixelShare
};
