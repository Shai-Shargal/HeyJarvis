import axios from 'axios';
import { google } from 'googleapis';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { GoogleToken } from '../models/GoogleToken';

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
}

/**
 * Exchange refresh token for access token
 */
export async function getGoogleAccessToken(userId: string): Promise<string> {
  try {
    // Get refresh token from MongoDB
    // Convert string userId to ObjectId for MongoDB query
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const googleToken = await GoogleToken.findOne({ userId: userObjectId });

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
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
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
function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Build Gmail search query for today's emails
 */
export function buildTodayQuery(): string {
  // Use newer_than:1d for simple MVP approach
  return 'newer_than:1d';
}

/**
 * Build Gmail search query for the newest email in inbox
 */
export function buildNewestQuery(): string {
  // Get the newest email from inbox
  return 'is:inbox';
}

/**
 * List messages matching a query (limited to maxResults for MVP)
 */
export async function listMessages(
  accessToken: string,
  query: string,
  maxResults: number = 50
): Promise<string[]> {
  try {
    const gmail = getGmailClient(accessToken);
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
export async function getMessageMetadata(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  try {
    const gmail = getGmailClient(accessToken);
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
 * Move messages to TRASH
 */
export async function moveMessagesToTrash(
  accessToken: string,
  messageIds: string[]
): Promise<void> {
  try {
    if (messageIds.length === 0) {
      return;
    }

    const gmail = getGmailClient(accessToken);

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

