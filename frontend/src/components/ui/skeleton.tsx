import { cn } from "@/utils/shadcn.ts"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
