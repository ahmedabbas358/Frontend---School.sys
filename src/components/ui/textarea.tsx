import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-sm shadow-xs transition-all duration-200 placeholder:text-muted-foreground/60 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 custom-scrollbar-slim md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
