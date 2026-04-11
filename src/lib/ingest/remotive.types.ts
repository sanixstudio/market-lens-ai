import { z } from "zod";

/**
 * One job object from Remotive's public API (`GET /api/remote-jobs`).
 * @see https://github.com/remotive-com/remote-jobs-api
 */
export const remotiveJobSchema = z.object({
  id: z.number().int(),
  url: z.string(),
  title: z.string(),
  company_name: z.string(),
  category: z.string().optional(),
  job_type: z.string().nullable().optional(),
  publication_date: z.string(),
  candidate_required_location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const remotiveApiResponseSchema = z.object({
  jobs: z.array(remotiveJobSchema),
});

export type RemotiveJob = z.infer<typeof remotiveJobSchema>;
