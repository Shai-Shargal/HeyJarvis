import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IActionLog } from '../models/action-log.schema';

export interface LogListItem {
  id: string;
  createdAt: Date;
  intent: string;
  status: string;
  affectedCount: number;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectModel('ActionLog') private actionLogModel: Model<IActionLog>,
  ) {}

  /**
   * Get logs list for a user
   */
  async getLogs(userId: string, limit: number = 20): Promise<LogListItem[]> {
    // Clamp limit between 1 and 50
    const clampedLimit = Math.max(1, Math.min(50, limit));

    const userObjectId = new Types.ObjectId(userId);
    const logs = await this.actionLogModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(clampedLimit)
      .select('_id createdAt plan.intent status affectedCount')
      .lean();

    return logs.map((log) => {
      // Use type assertion with unknown first to avoid type errors
      const logDoc = log as unknown as IActionLog & { createdAt: Date };
      return {
        id: log._id.toString(),
        createdAt: logDoc.createdAt || new Date(),
        intent: log.plan.intent,
        status: log.status,
        affectedCount: log.affectedCount,
      };
    });
  }

  /**
   * Get a single log by ID (ensuring it belongs to the user)
   */
  async getLogById(userId: string, logId: string): Promise<IActionLog> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(logId)) {
      throw new NotFoundException('Invalid log ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    const logObjectId = new Types.ObjectId(logId);

    const log = await this.actionLogModel.findOne({
      _id: logObjectId,
      userId: userObjectId,
    });

    if (!log) {
      throw new NotFoundException('Log not found');
    }

    return log;
  }
}

