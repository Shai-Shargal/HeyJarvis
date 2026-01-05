import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { GmailService } from '../gmail/gmail.service';
import { ActionPlan } from './chat.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly llmService: LLMService,
    private readonly gmailService: GmailService,
  ) {}

  async generateActionPlan(userMessage: string, userId: string): Promise<ActionPlan> {
    try {
      // Generate plan from LLM
      const plan = await this.llmService.generateActionPlan(userMessage);

      // Try to get real email samples from Gmail
      try {
        const accessToken = await this.gmailService.getGoogleAccessToken(userId);
        
        // Check if user asked for "latest" email - use a better query
        const isLatestEmail = userMessage.toLowerCase().includes('latest') || 
                              userMessage.toLowerCase().includes('newest') ||
                              userMessage.toLowerCase().includes('most recent');
        
        let query = plan.params.query;
        let maxResults = 100;
        
        // For "latest" queries, get the actual newest email from inbox
        if (isLatestEmail) {
          query = 'is:inbox'; // Get from inbox, sorted by newest first
          maxResults = 10; // Get top 10 to filter out OpenAI emails
        }
        
        // Get message IDs matching the query
        const messageIds = await this.gmailService.listMessages(
          accessToken,
          query,
          maxResults
        );

        if (messageIds.length > 0) {
          // Get metadata for all messages to filter
          const allSamples = await Promise.all(
            messageIds.map((id) => this.gmailService.getMessageMetadata(accessToken, id))
          );
          
          // Filter out OpenAI emails when user asks for "latest"
          let filteredSamples = allSamples;
          if (isLatestEmail) {
            filteredSamples = allSamples.filter((email) => {
              const fromLower = email.from.toLowerCase();
              // Filter out OpenAI automated emails
              return !fromLower.includes('openai.com') && 
                     !fromLower.includes('noreply@tm1.openai.com') &&
                     !fromLower.includes('billing@tm1.openai.com');
            });
            
            // If we filtered everything out, show the actual latest (even if OpenAI)
            if (filteredSamples.length === 0 && allSamples.length > 0) {
              filteredSamples = [allSamples[0]]; // Show the actual latest
            }
          }
          
          // For "latest", show only the first (newest) one
          // Otherwise show up to 3 samples
          const sampleCount = isLatestEmail ? 1 : Math.min(3, filteredSamples.length);
          const finalSamples = filteredSamples.slice(0, sampleCount);
          
          // Replace LLM-generated samples with real email samples
          plan.estimatedImpact.sample = finalSamples.map((email) => ({
            subject: email.subject || '(No subject)',
            from: email.from,
            date: email.date,
          }));
          
          // Update count
          if (isLatestEmail) {
            plan.estimatedImpact.count = 1;
          } else {
            plan.estimatedImpact.count = filteredSamples.length;
          }
        } else {
          // No emails found, clear samples
          plan.estimatedImpact.sample = [];
          plan.estimatedImpact.count = 0;
        }
      } catch (gmailError) {
        // If Gmail query fails, keep the LLM-generated samples
        // This is fine - the plan is still valid, just with estimated samples
        console.warn('Could not fetch real email samples, using LLM estimates:', gmailError);
      }

      return plan;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate action plan: ${error.message}`);
      }
      throw new Error('Unknown error generating action plan');
    }
  }
}
