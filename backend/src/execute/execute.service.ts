import { Injectable } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { ActionPlan } from '../chat/chat.types';

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
  constructor(private readonly gmailService: GmailService) {}

  async executePlan(userId: string, plan: ActionPlan): Promise<ExecuteResult> {
    try {
      // Get access token
      const accessToken = await this.gmailService.getGoogleAccessToken(userId);

      // Get message IDs matching the query
      const messageIds = await this.gmailService.listMessages(
        accessToken,
        plan.params.query,
        100 // Limit to 100 emails
      );

      if (messageIds.length === 0) {
        return {
          success: true,
          action: plan.intent,
          emailsAffected: 0,
          sample: [],
          message: 'No emails found matching the query',
        };
      }

      // Get sample emails for response
      const sampleCount = Math.min(3, messageIds.length);
      const samplePromises = messageIds
        .slice(0, sampleCount)
        .map((id) => this.gmailService.getMessageMetadata(accessToken, id));
      
      const sample = await Promise.all(samplePromises);

      // Execute the action based on intent
      switch (plan.intent) {
        case 'DELETE_EMAILS':
          await this.gmailService.moveMessagesToTrash(accessToken, messageIds);
          return {
            success: true,
            action: 'DELETE_EMAILS',
            emailsAffected: messageIds.length,
            sample: sample.map((email) => ({
              subject: email.subject || '(No subject)',
              from: email.from,
              date: email.date,
            })),
            message: `Successfully deleted ${messageIds.length} email(s)`,
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
      if (error instanceof Error) {
        throw new Error(`Failed to execute plan: ${error.message}`);
      }
      throw new Error('Unknown error executing plan');
    }
  }
}

