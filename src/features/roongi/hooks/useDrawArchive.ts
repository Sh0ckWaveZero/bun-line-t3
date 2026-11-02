import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";

const drawArchiveSchema = z.object({
  total: z.number().int().nonnegative(),
  dates: z.array(z.iso.date()),
});

function getUniqueDates(pages: Array<z.infer<typeof drawArchiveSchema>>) {
  return [...new Set(pages.flatMap((page) => page.dates))];
}

export function useDrawArchive() {
  const query = useInfiniteQuery({
    queryKey: ["roongi", "archive"],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const response = await fetch(`/api/roongi?page=${pageParam}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("โหลดรายการงวดย้อนหลังไม่สำเร็จ");

      return drawArchiveSchema.parse(await response.json());
    },
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      const uniqueDateCount = getUniqueDates(pages).length;
      return uniqueDateCount < lastPage.total ? lastPageParam + 1 : undefined;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const archiveDates = getUniqueDates(query.data?.pages ?? []);
  const archiveTotal = query.data?.pages.at(-1)?.total ?? 0;
  const isLoadingArchive = query.isFetching;
  const archiveError = query.isError && !query.isFetching;

  function retryArchive() {
    return query.data?.pages.length ? query.fetchNextPage() : query.refetch();
  }

  return {
    archiveDates,
    archiveTotal,
    archiveError,
    isLoadingArchive,
    hasMoreArchive: query.hasNextPage,
    loadMoreArchive: query.fetchNextPage,
    retryArchive,
  };
}
