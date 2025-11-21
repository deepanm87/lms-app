import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-y-8">
        <Skeleton className="h-8 w-[50%]" />

        <div className="aspect-video w-full">
          <Skeleton className="h-full w-full rounded-md" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[75%]" />
          <Skeleton className="h-4 w-[85%]" />

          <div className="py-2" />

          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
      </div>
    </div>
  )
}