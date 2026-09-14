import type { Document, Types } from 'mongoose';

export interface IChatProject {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  user: string;
  conversationCount: number;
  lastConversationAt?: Date | null;
  lastConversationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
  /** KMH: pod colour key from the fixed palette. */
  color?: string;
}

export interface IChatProjectDocument extends Omit<IChatProject, '_id'>, Document {}
