/**
 * Health Activity Feature Types
 * Types for health and fitness activity tracking
 */

export interface ActivityData {
  id: string;
  userId: string;
  activityType: ActivityType;
  date: Date;
  duration: number; // minutes
  distance?: number; // kilometers
  calories?: number;
  steps?: number;
  heartRate?: {
    average?: number;
    max?: number;
    min?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityType =
  | "walking"
  | "running"
  | "cycling"
  | "swimming"
  | "workout"
  | "yoga"
  | "other";

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
  userId: string;
  date: Date;
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  bodyFat?: number; // percentage
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  restingHeartRate?: number;
  sleepHours?: number;
  waterIntake?: number; // liters
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
