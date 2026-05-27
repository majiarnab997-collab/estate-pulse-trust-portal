/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'CUSTOMER' | 'ADMIN';

export type DocumentStatus = 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export type MediaType = 'IMAGE' | 'VIDEO' | 'WALKTHROUGH';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

export interface Property {
  id: string;
  plotNumber: string;
  plotSize: string;
  location: string;
  googleMapsUrl?: string;
  projectPhase: string;
  amenities: string[];
  constructionStatus: number; // percentage 0-100
  brochureUrl?: string;
  legalClearance: boolean;
  createdAt: string;
}

export interface PropertyAllocation {
  id: string;
  userId: string;
  propertyId: string;
  allocatedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: string;
  fileUrl: string;
  status: DocumentStatus;
  remarks?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface DocumentStatusHistory {
  id: string;
  documentId: string;
  status: DocumentStatus;
  changedBy: string;
  remarks?: string;
  changedAt: string;
}

export interface Payment {
  id: string;
  propertyAllocationId: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidAt?: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Invoice {
  id: string;
  paymentId: string;
  invoiceNum: string;
  pdfUrl: string;
  issuedAt: string;
}

export interface Media {
  id: string;
  propertyId: string;
  type: MediaType;
  url: string;
  title: string;
  caption?: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  createdAt: string;
}
