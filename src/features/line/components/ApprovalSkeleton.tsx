import { APPROVAL_TABS, SKELETON_ROW_COUNT } from "@/features/line/line-utils/approvals";

export function ApprovalSkeleton() {
  return (
    <div>
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-4 w-44 rounded-md" />
        <div className="skel-bar mt-2.5 h-3 w-64 rounded-md" />
      </div>
      <div className="flex gap-6 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        {Array.from({ length: APPROVAL_TABS.length }, (_, index) => (
          <div key={index} className="skel-bar h-4 w-16 rounded-md" />
        ))}
      </div>
      <div className="border-b border-slate-200 px-5 py-3 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-10 max-w-[340px] rounded-xl" />
      </div>
      <div>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-slate-200/80 px-3 py-4 dark:border-white/[0.07]"
          >
            <div className="skel-bar size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skel-bar h-3.5 w-40 rounded-md" />
              <div className="skel-bar mt-1.5 h-3 w-52 rounded-md" />
            </div>
            <div className="skel-bar h-6 w-24 shrink-0 rounded-md" />
            <div className="skel-bar size-8 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-5 w-24 rounded-md" />
        <div className="skel-bar h-5 w-40 rounded-md" />
      </div>
    </div>
  );
}
