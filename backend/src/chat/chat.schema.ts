import { z } from 'zod';
import { ActionPlan } from './chat.types';

const emailSampleSchema = z.object({
  subject: z.string(),
  from: z.string(),
  date: z.string(),
});

const estimatedImpactSchema = z.object({
  count: z.number().int().min(0).max(1000),
  sample: z.array(emailSampleSchema).max(3),
});

const actionPlanSchema = z.object({
  intent: z.enum(['DELETE_EMAILS', 'ARCHIVE_EMAILS', 'LABEL_EMAILS']),
  params: z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    labelName: z.string().optional(),
  }),
  estimatedImpact: estimatedImpactSchema,
  explanation: z.string().min(1),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export function validateActionPlan(data: unknown): ActionPlan {
  return actionPlanSchema.parse(data);
}
