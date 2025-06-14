/**
 * 🛡️ NoSSR Component - ป้องกัน Hydration Mismatch
 * Component wrapper ที่ป้องกันการ render บน server-side
 * ใช้สำหรับ components ที่มี dynamic content หรือใช้ browser APIs
 */

"use client";

import React, { useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  defer?: boolean;
}

/**
 * 🎯 NoSSR Component
 * ป้องกัน hydration mismatch โดยไม่ render children จนกว่า client จะพร้อม
 */
export const NoSSR: React.FC<NoSSRProps> = ({ 
  children, 
  fallback = null,
  defer = false 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (defer) {
      // รอ 1 tick เพื่อให้ browser render ก่อน
      const timer = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [defer]);

  // ไม่ render children จนกว่า component จะ mount บน client
  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * 🔄 Higher-Order Component สำหรับ NoSSR
 */
export function withNoSSR<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => (
    <NoSSR fallback={fallback}>
      <Component {...props} />
    </NoSSR>
  );

  WrappedComponent.displayName = `withNoSSR(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * 🎭 ClientOnly Component - อีกชื่อหนึ่งของ NoSSR
 */
export const ClientOnly = NoSSR;

export default NoSSR;
