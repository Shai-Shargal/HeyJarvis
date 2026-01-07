import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { google } from 'googleapis';
import { IGoogleToken } from '../models/google-token.schema';

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet?: string; // Optional snippet for message preview
}

@Injectable()
export class GmailService {
  constructor(
    @InjectModel('GoogleToken') private googleTokenModel: Model<IGoogleToken>,
    private configService: ConfigService,
  ) {}

  /**
   * Exchange refresh token for access token
   */
  async getGoogleAccessToken(userId: string): Promise<string> {
    try {
      // Get refresh token from MongoDB
      const userObjectId = new Types.ObjectId(userId);
      const googleToken = await this.googleTokenModel.findOne({ userId: userObjectId });

      if (!googleToken) {
        console.error('❌ No Google token found for user:', userId);
        throw new Error('No Google token found for user. Please re-authenticate.');
      }

      console.log('✅ Found Google token for user, exchanging refresh token...');

      // Exchange refresh token for access token
      const response = await axios.post<{
        access_token: string;
        expires_in: number;
        token_type: string;
      }>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          refresh_token: googleToken.refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Successfully obtained access token');
      return response.data.access_token;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      if (axios.isAxiosError(error)) {
        const errorDetails = error.response?.data || {};
        console.error('   Error details:', JSON.stringify(errorDetails, null, 2));
        throw new Error(
          `Failed to get access token: ${error.response?.data?.error || error.message}`
        );
      }
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Get Gmail client with access token
   */
  private getGmailClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI')
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Build Gmail search query for today's emails
   */
  buildTodayQuery(): string {
    // Use newer_than:1d for simple MVP approach
    return 'newer_than:1d';
  }

  /**
   * Build Gmail search query for the newest email in inbox
   */
  buildNewestQuery(): string {
    // Get the newest email from inbox
    return 'is:inbox';
  }

  /**
   * List messages matching a query (limited to maxResults for MVP)
   */
  async listMessages(
    accessToken: string,
    query: string,
    maxResults: number = 50
  ): Promise<string[]> {
    try {
      const gmail = this.getGmailClient(accessToken);
      const messageIds: string[] = [];
      let pageToken: string | undefined;

      do {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: Math.min(maxResults - messageIds.length, 50), // Limit per page
          pageToken,
        });

        if (response.data.messages) {
          messageIds.push(...response.data.messages.map((msg) => msg.id!));
        }

        // Stop if we've reached maxResults
        if (messageIds.length >= maxResults) {
          break;
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken && messageIds.length < maxResults);

      return messageIds.slice(0, maxResults);
    } catch (error: any) {
      console.error('❌ Error listing messages:', error);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.message) {
        console.error('   Error message:', error.message);
      }
      throw new Error(`Failed to list Gmail messages: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get message metadata
   */
  async getMessageMetadata(
    accessToken: string,
    messageId: string
  ): Promise<GmailMessage> {
    try {
      const gmail = this.getGmailClient(accessToken);
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const headers = response.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: messageId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
      };
    } catch (error) {
      console.error('Error getting message metadata:', error);
      throw new Error(`Failed to get message metadata for ${messageId}`);
    }
  }

  /**
   * Get message metadata with snippet (for logs)
   */
  async getMessageWithSnippet(
    accessToken: string,
    messageId: string
  ): Promise<GmailMessage> {
    try {
      const gmail = this.getGmailClient(accessToken);
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const headers = response.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      // Get snippet from response (Gmail API provides this automatically)
      const snippet = response.data.snippet || '';

      return {
        id: messageId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: snippet.substring(0, 200), // Limit snippet to 200 chars
      };
    } catch (error) {
      console.error('Error getting message with snippet:', error);
      throw new Error(`Failed to get message with snippet for ${messageId}`);
    }
  }

  /**
   * Move messages to TRASH
   */
  async moveMessagesToTrash(
    accessToken: string,
    messageIds: string[]
  ): Promise<void> {
    try {
      if (messageIds.length === 0) {
        return;
      }

      const gmail = this.getGmailClient(accessToken);

      // Batch modify messages to add TRASH label
      // In Gmail API, TRASH label ID is 'TRASH'
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          addLabelIds: ['TRASH'],
        },
      });
    } catch (error) {
      console.error('Error moving messages to trash:', error);
      throw new Error('Failed to move messages to trash');
    }
  }
}
