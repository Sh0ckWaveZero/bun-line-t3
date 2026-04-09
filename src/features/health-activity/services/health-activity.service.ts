/**
 * Health Activity Service
 * Service for managing health and fitness activity data
 */
import { db } from "@/lib/database/db";
import { ActivityType, Prisma } from "@prisma/client";
import type {
  ActivityData,
  ActivitySummary,
  CreateActivityInput,
  GetActivitiesQuery,
  HealthMetrics,
} from "../types";

export class HealthActivityService {
  /**
   * Create a new activity record
   */
  async createActivity(input: CreateActivityInput): Promise<ActivityData> {
    const activity = await db.healthActivity.create({
      data: {
        userId: input.userId,
        activityType: input.activityType as ActivityType,
        date: input.date,
        duration: input.duration,
        distance: input.distance,
        calories: input.calories,
        steps: input.steps,
        heartRate: input.heartRate as Prisma.InputJsonValue,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });

    return this.mapToActivityData(activity);
  }

  /**
   * Map Prisma result to ActivityData with proper type safety
   */
  private mapToActivityData(activity: {
    id: string;
    userId: string;
    activityType: ActivityType;
    date: Date;
    duration: number;
    distance: number | null;
    calories: number | null;
    steps: number | null;
    heartRate: Prisma.JsonValue;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }): ActivityData {
    return {
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      date: activity.date,
      duration: activity.duration,
      distance: activity.distance,
      calories: activity.calories,
      steps: activity.steps,
      heartRate: this.parseHeartRate(activity.heartRate),
      metadata: this.parseMetadata(activity.metadata),
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  /**
   * Safely parse heartRate JSON data
   */
  private parseHeartRate(
    data: Prisma.JsonValue,
  ): { average?: number; max?: number; min?: number } | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;

    const heartRate: {
      average?: number;
      max?: number;
      min?: number;
    } = {};

    const record = data as Record<string, unknown>;
    if (typeof record.average === "number") heartRate.average = record.average;
    if (typeof record.max === "number") heartRate.max = record.max;
    if (typeof record.min === "number") heartRate.min = record.min;

    return Object.keys(heartRate).length > 0 ? heartRate : null;
  }

  /**
   * Safely parse metadata JSON data
   */
  private parseMetadata(
    data: Prisma.JsonValue,
  ): Record<string, unknown> | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  }

  /**
   * Get activities for a user with optional filters
   */
  async getActivities(query: GetActivitiesQuery): Promise<ActivityData[]> {
    const {
      userId,
      startDate,
      endDate,
      activityType,
      limit = 50,
      offset = 0,
    } = query;

    interface WhereClause {
      userId: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
      activityType?: ActivityType;
    }

    const where: WhereClause = { userId };

    if (startDate ?? endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (activityType) {
      where.activityType = activityType;
    }

    const activities = await db.healthActivity.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    return activities.map((activity) => this.mapToActivityData(activity));
  }

  /**
   * Get activity summary for a period
   */
  async getActivitySummary(
    userId: string,
    period: "daily" | "weekly" | "monthly",
    date: Date = new Date(),
  ): Promise<ActivitySummary> {
    const { startDate, endDate } = this.getPeriodRange(period, date);

    const activities = await this.getActivities({
      userId,
      startDate,
      endDate,
    });

    const summary: ActivitySummary = {
      userId,
      period,
      startDate,
      endDate,
      totalActivities: activities.length,
      totalDuration: 0,
      totalDistance: 0,
      totalCalories: 0,
      totalSteps: 0,
      activities,
    };

    let heartRateSum = 0;
    let heartRateCount = 0;

    for (const activity of activities) {
      summary.totalDuration += activity.duration || 0;
      summary.totalDistance! += activity.distance || 0;
      summary.totalCalories! += activity.calories || 0;
      summary.totalSteps! += activity.steps || 0;

      if (activity.heartRate?.average) {
        heartRateSum += activity.heartRate.average;
        heartRateCount++;
      }
    }

    if (heartRateCount > 0) {
      summary.averageHeartRate = Math.round(heartRateSum / heartRateCount);
    }

    return summary;
  }

  /**
   * Get today's activity summary
   */
  async getTodayActivity(userId: string): Promise<ActivitySummary> {
    return this.getActivitySummary(userId, "daily", new Date());
  }

  /**
   * Get this week's activity summary
   */
  async getWeeklyActivity(userId: string): Promise<ActivitySummary> {
    return this.getActivitySummary(userId, "weekly", new Date());
  }

  /**
   * Get this month's activity summary
   */
  async getMonthlyActivity(userId: string): Promise<ActivitySummary> {
    return this.getActivitySummary(userId, "monthly", new Date());
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string, userId: string): Promise<boolean> {
    try {
      await db.healthActivity.delete({
        where: {
          id: activityId,
          userId,
        },
      });
      return true;
    } catch (error) {
      console.error("Error deleting activity:", error);
      return false;
    }
  }

  /**
   * Get user's health metrics
   */
  async getHealthMetrics(
    userId: string,
    date?: Date,
  ): Promise<HealthMetrics | null> {
    const targetDate = date || new Date();

    const metrics = await db.healthMetrics.findFirst({
      where: {
        userId,
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { date: "desc" },
    });

    if (!metrics) return null;

    return this.mapToHealthMetrics(metrics);
  }

  /**
   * Map Prisma result to HealthMetrics with proper type safety
   */
  private mapToHealthMetrics(metrics: {
    id: string;
    userId: string;
    date: Date;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    bodyFat: number | null;
    bloodPressure: Prisma.JsonValue;
    restingHeartRate: number | null;
    sleepHours: number | null;
    waterIntake: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): HealthMetrics {
    return {
      id: metrics.id,
      userId: metrics.userId,
      date: metrics.date,
      weight: metrics.weight,
      height: metrics.height,
      bmi: metrics.bmi,
      bodyFat: metrics.bodyFat,
      bloodPressure: this.parseBloodPressure(metrics.bloodPressure),
      restingHeartRate: metrics.restingHeartRate,
      sleepHours: metrics.sleepHours,
      waterIntake: metrics.waterIntake,
      createdAt: metrics.createdAt,
      updatedAt: metrics.updatedAt,
    };
  }

  /**
   * Safely parse bloodPressure JSON data
   */
  private parseBloodPressure(
    data: Prisma.JsonValue,
  ): { systolic: number; diastolic: number } | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;

    const record = data as Record<string, unknown>;
    if (
      typeof record.systolic === "number" &&
      typeof record.diastolic === "number"
    ) {
      return {
        systolic: record.systolic,
        diastolic: record.diastolic,
      };
    }

    return null;
  }

  /**
   * Save health metrics with proper type conversion
   */
  async saveHealthMetrics(
    metrics: Partial<HealthMetrics> & { userId: string },
  ): Promise<HealthMetrics> {
    const bloodPressureData = metrics.bloodPressure as Prisma.InputJsonValue;

    const result = await db.healthMetrics.upsert({
      where: {
        userId_date: {
          userId: metrics.userId,
          date: metrics.date ?? new Date(),
        },
      },
      create: {
        userId: metrics.userId,
        date: metrics.date ?? new Date(),
        weight: metrics.weight,
        height: metrics.height,
        bmi: metrics.bmi,
        bodyFat: metrics.bodyFat,
        bloodPressure: bloodPressureData,
        restingHeartRate: metrics.restingHeartRate,
        sleepHours: metrics.sleepHours,
        waterIntake: metrics.waterIntake,
      },
      update: {
        weight: metrics.weight,
        height: metrics.height,
        bmi: metrics.bmi,
        bodyFat: metrics.bodyFat,
        bloodPressure: bloodPressureData,
        restingHeartRate: metrics.restingHeartRate,
        sleepHours: metrics.sleepHours,
        waterIntake: metrics.waterIntake,
      },
    });

    return this.mapToHealthMetrics(result);
  }

  /**
   * Helper: Get date range for period
   */
  private getPeriodRange(
    period: "daily" | "weekly" | "monthly",
    date: Date,
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (period) {
      case "daily":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly": {
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "monthly":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }
}

export const healthActivityService = new HealthActivityService();
