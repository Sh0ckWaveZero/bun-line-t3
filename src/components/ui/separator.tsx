import * as React from "react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-border h-[1px] w-full shrink-0", className)}
    role="separator"
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
