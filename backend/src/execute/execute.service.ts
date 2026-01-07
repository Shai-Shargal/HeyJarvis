import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GmailService } from '../gmail/gmail.service';
import { ActionPlan } from '../chat/chat.types';
import { IActionLog, ExecutionStatus } from '../models/action-log.schema';

export interface ExecuteResult {
  success: boolean;
  action: string;
  emailsAffected: number;
  sample: Array<{
    subject: string;
    from: string;
    date: string;
  }>;
  message: string;
}

@Injectable()
export class ExecuteService {
  constructor(
    private readonly gmailService: GmailService,
    @InjectModel('ActionLog') private actionLogModel: Model<IActionLog>,
  ) {}

  async executePlan(
    userId: string,
    plan: ActionPlan,
    message?: string,
    approved: boolean = true,
  ): Promise<ExecuteResult> {
    const startedAt = new Date();
    let status: ExecutionStatus = 'SUCCESS';
    let errorMessage: string | undefined;
    let affectedCount = 0;
    let queryUsed = plan.params.query || '';
    let messageIds: string[] = [];
    let sample: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
    }> = [];

    try {
      // Ensure params exists
      if (!plan.params) {
        plan.params = { query: '' };
      }

      // Get access token
      const accessToken = await this.gmailService.getGoogleAccessToken(userId);

      // Calculate safe execution cap
      // Support maxResults from plan, but hard cap at 50 for safety
      // This ensures we NEVER affect more than 50 emails
      const requestedMax = plan.params.maxResults;
      const executionCap = requestedMax !== undefined 
        ? Math.min(Math.max(1, requestedMax), 50) // Clamp between 1 and 50
        : 50; // Default to 50
      
      console.log('🔍 ExecuteService Debug:', {
        maxResults: requestedMax,
        executionCap,
        query: plan.params.query,
      });

      // Get message IDs matching the query (limited by execution cap)
      console.log('🔍 Fetching messages:', {
        query: plan.params.query,
        executionCap,
      });
      
      const foundMessageIds = await this.gmailService.listMessages(
        accessToken,
        plan.params.query,
        executionCap // SAFETY: Hard cap - never fetch more than executionCap
      );

      console.log('📬 Found messages:', {
        count: foundMessageIds.length,
        messageIds: foundMessageIds.slice(0, 5), // Log first 5
      });

      // SINGLE SOURCE OF TRUTH: idsToAffect
      // This array determines exactly which emails will be affected
      // All operations (delete, count, logging) MUST use this array
      const idsToAffect = foundMessageIds.slice(0, executionCap);
      
      console.log('✅ IDs to affect:', {
        count: idsToAffect.length,
        messageIds: idsToAffect,
      });

      if (idsToAffect.length === 0) {
        affectedCount = 0;
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        // Save log for "no emails found" case
        await this.saveActionLog({
          userId,
          message,
          plan,
          approved,
          status: 'SUCCESS',
          startedAt,
          finishedAt,
          durationMs,
          affectedCount,
          queryUsed,
          messageIds: [],
          sample: [],
        });

        return {
          success: true,
          action: plan.intent,
          emailsAffected: 0,
          sample: [],
          message: 'No emails found matching the query',
        };
      }

      // Get sample emails with snippets for logs (up to 5)
      const sampleCount = Math.min(5, idsToAffect.length);
      const samplePromises = idsToAffect
        .slice(0, sampleCount)
        .map((id) => this.gmailService.getMessageWithSnippet(accessToken, id));

      const sampleWithSnippets = await Promise.all(samplePromises);

      // Execute the action based on intent
      switch (plan.intent) {
        case 'DELETE_EMAILS':
          console.log('🗑️ Deleting emails:', {
            count: idsToAffect.length,
            messageIds: idsToAffect,
          });
          
          // SAFETY: Only delete emails in idsToAffect (never more than executionCap)
          await this.gmailService.moveMessagesToTrash(accessToken, idsToAffect);
          
          console.log('✅ Successfully moved emails to trash');
          
          // SINGLE SOURCE OF TRUTH: affectedCount = idsToAffect.length
          affectedCount = idsToAffect.length;
          
          // SINGLE SOURCE OF TRUTH: messageIds = idsToAffect (for logging)
          messageIds = idsToAffect;

          // Prepare sample for response (without snippet) and log (with snippet)
          const responseSample = sampleWithSnippets.map((email) => ({
            subject: email.subject || '(No subject)',
            from: email.from,
            date: email.date,
          }));

          sample = sampleWithSnippets.map((email) => ({
            id: email.id,
            subject: email.subject || '(No subject)',
            from: email.from,
            date: email.date,
            snippet: email.snippet || '',
          }));

          const finishedAt = new Date();
          const durationMs = finishedAt.getTime() - startedAt.getTime();

          // Save success log
          await this.saveActionLog({
            userId,
            message,
            plan,
            approved,
            status: 'SUCCESS',
            startedAt,
            finishedAt,
            durationMs,
            affectedCount,
            queryUsed,
            messageIds,
            sample,
          });

          return {
            success: true,
            action: 'DELETE_EMAILS',
            emailsAffected: affectedCount,
            sample: responseSample,
            message: `Successfully deleted ${affectedCount} email(s)`,
          };

        case 'ARCHIVE_EMAILS':
          // Archive emails by removing INBOX label (not yet implemented)
          throw new Error('Archive functionality not yet implemented. Use DELETE_EMAILS instead.');

        case 'LABEL_EMAILS':
          // Label emails (requires label creation/retrieval)
          throw new Error('LABEL_EMAILS not yet implemented');

        default:
          throw new Error(`Unknown intent: ${plan.intent}`);
      }
    } catch (error) {
      // Mark as failed
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Unknown error executing plan';
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      // Save failure log
      await this.saveActionLog({
        userId,
        message,
        plan,
        approved,
        status: 'FAILED',
        startedAt,
        finishedAt,
        durationMs,
        errorMessage,
        affectedCount,
        queryUsed,
        messageIds,
        sample,
      });

      // Re-throw the error to maintain existing error response behavior
      if (error instanceof Error) {
        throw new Error(`Failed to execute plan: ${error.message}`);
      }
      throw new Error('Unknown error executing plan');
    }
  }

  /**
   * Log a confirmation-required failure (guardrail blocked execution)
   */
  async logConfirmationRequired(
    userId: string,
    plan: ActionPlan,
    message?: string,
  ): Promise<void> {
    const startedAt = new Date();
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await this.saveActionLog({
      userId,
      message,
      plan,
      approved: false,
      status: 'FAILED',
      startedAt,
      finishedAt,
      durationMs,
      errorMessage: 'CONFIRMATION_REQUIRED',
      affectedCount: 0,
      queryUsed: plan.params.query || '',
      messageIds: [],
      sample: [],
    });
  }

  /**
   * Save action log to database
   */
  private async saveActionLog(logData: {
    userId: string;
    message?: string;
    plan: ActionPlan;
    approved: boolean;
    status: ExecutionStatus;
    startedAt: Date;
    finishedAt: Date;
    durationMs: number;
    errorMessage?: string;
    affectedCount: number;
    queryUsed: string;
    messageIds: string[];
    sample: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
    }>;
  }): Promise<void> {
    try {
      const userObjectId = new Types.ObjectId(logData.userId);
      await this.actionLogModel.create({
        userId: userObjectId,
        message: logData.message,
        plan: logData.plan,
        approved: logData.approved,
        status: logData.status,
        startedAt: logData.startedAt,
        finishedAt: logData.finishedAt,
        durationMs: logData.durationMs,
        errorMessage: logData.errorMessage,
        affectedCount: logData.affectedCount,
        queryUsed: logData.queryUsed,
        messageIds: logData.messageIds,
        sample: logData.sample,
      });
    } catch (error) {
      // Log error but don't fail the execution
      console.error('Failed to save action log:', error);
    }
  }
}

