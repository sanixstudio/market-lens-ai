import { z } from "zod";

export const anonKeySchema = z.string().uuid("Invalid anonymous session id");

export const watchlistPostSchema = z.object({
  regionId: z.string().min(1),
});

export type WatchlistPostBody = z.infer<typeof watchlistPostSchema>;

export const watchlistItemResponseSchema = z.object({
  regionId: z.string(),
  regionName: z.string(),
  createdAt: z.string(),
});

export const watchlistListResponseSchema = z.object({
  items: z.array(watchlistItemResponseSchema),
});
