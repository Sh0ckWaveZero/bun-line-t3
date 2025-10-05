/**
 * Health Activity Feature Types
 * Types for health and fitness activity tracking
 */
import type { ActivityType as PrismaActivityType } from "@prisma/client";

export type ActivityType = PrismaActivityType;

export interface ActivityData {
  id: string;
  userId: string;
  activityType: ActivityType;
  date: Date;
  duration: number; // minutes
  distance?: number | null; // kilometers
  calories?: number | null;
  steps?: number | null;
  heartRate?: {
    average?: number;
    max?: number;
    min?: number;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivitySummary {
  userId: string;
  period: "daily" | "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
  totalActivities: number;
  totalDuration: number; // minutes
  totalDistance?: number; // kilometers
  totalCalories?: number;
  totalSteps?: number;
  averageHeartRate?: number;
  activities: ActivityData[];
}

export interface HealthMetrics {
  id: string;
  userId: string;
  date: Date;
  weight?: number | null; // kg
  height?: number | null; // cm
  bmi?: number | null;
  bodyFat?: number | null; // percentage
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  } | null;
  restingHeartRate?: number | null;
  sleepHours?: number | null;
  waterIntake?: number | null; // liters
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivityInput {
  userId: string;
  activityType: ActivityType;
  date: Date;
  duration: number;
  distance?: number;
  calories?: number;
  steps?: number;
  heartRate?: {
    average?: number;
    max?: number;
    min?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface GetActivitiesQuery {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  activityType?: ActivityType;
  limit?: number;
  offset?: number;
}
