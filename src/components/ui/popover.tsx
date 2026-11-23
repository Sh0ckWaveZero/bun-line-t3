import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import {
  PopoverTriggerContext,
  SetPopoverTriggerContext,
  usePopoverPortalContainer,
} from "@/components/ui/popover-portal";
import { cn } from "@/lib/utils";

const Popover = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => {
  const [trigger, setTrigger] = React.useState<HTMLElement | null>(null);
  return (
    <PopoverPrimitive.Root {...props}>
      <SetPopoverTriggerContext.Provider value={setTrigger}>
        <PopoverTriggerContext.Provider value={trigger}>
          {children}
        </PopoverTriggerContext.Provider>
      </SetPopoverTriggerContext.Provider>
    </PopoverPrimitive.Root>
  );
};

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ ...props }, forwardedRef) => {
  const setTrigger = React.useContext(SetPopoverTriggerContext);
  // ref ของผู้เรียกกับ element ที่เก็บให้ PopoverContent — cleanup คืนค่าให้ทั้งคู่ตอน detach
  const ref = React.useCallback(
    (node: React.ElementRef<typeof PopoverPrimitive.Trigger> | null) => {
      setTrigger(node);
      let callerCleanup: (() => void) | undefined;
      if (typeof forwardedRef === "function") {
        callerCleanup = forwardedRef(node) ?? undefined;
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
      return () => {
        callerCleanup?.();
        setTrigger(null);
      };
    },
    [forwardedRef, setTrigger],
  );
  return <PopoverPrimitive.Trigger {...props} ref={ref} />;
});
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const container = usePopoverPortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
