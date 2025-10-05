/**
 * Activity Formatter Helper
 * Formats activity data for display in LINE messages
 */
import type { ActivityData, ActivitySummary } from "../types";

export class ActivityFormatter {
  /**
   * Format activity summary for LINE message
   */
  static formatSummary(summary: ActivitySummary): string {
    const { period, totalActivities, totalDuration, totalDistance, totalCalories, totalSteps } = summary;

    const periodName = {
      daily: "วันนี้",
      weekly: "สัปดาห์นี้",
      monthly: "เดือนนี้",
    }[period];

    let message = `📊 สรุปกิจกรรม${periodName}\n\n`;
    message += `🏃 จำนวนกิจกรรม: ${totalActivities} ครั้ง\n`;
    message += `⏱ เวลารวม: ${this.formatDuration(totalDuration)}\n`;

    if (totalDistance && totalDistance > 0) {
      message += `📏 ระยะทาง: ${totalDistance.toFixed(2)} กม.\n`;
    }

    if (totalCalories && totalCalories > 0) {
      message += `🔥 แคลอรี่: ${totalCalories.toFixed(0)} kcal\n`;
    }

    if (totalSteps && totalSteps > 0) {
      message += `👟 ก้าว: ${totalSteps.toLocaleString()} ก้าว\n`;
    }

    if (summary.averageHeartRate) {
      message += `💓 อัตราการเต้นหัวใจเฉลี่ย: ${summary.averageHeartRate} bpm\n`;
    }

    return message;
  }

  /**
   * Format single activity for LINE message
   */
  static formatActivity(activity: ActivityData): string {
    const activityName = this.getActivityName(activity.activityType);
    const date = new Date(activity.date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `🏃 ${activityName}\n`;
    message += `📅 ${date}\n`;
    message += `⏱ ระยะเวลา: ${this.formatDuration(activity.duration)}\n`;

    if (activity.distance) {
      message += `📏 ระยะทาง: ${activity.distance.toFixed(2)} กม.\n`;
    }

    if (activity.calories) {
      message += `🔥 แคลอรี่: ${activity.calories.toFixed(0)} kcal\n`;
    }

    if (activity.steps) {
      message += `👟 ก้าว: ${activity.steps.toLocaleString()} ก้าว\n`;
    }

    if (activity.heartRate) {
      if (activity.heartRate.average) {
        message += `💓 อัตราการเต้นหัวใจเฉลี่ย: ${activity.heartRate.average} bpm\n`;
      }
      if (activity.heartRate.max) {
        message += `💓 สูงสุด: ${activity.heartRate.max} bpm\n`;
      }
    }

    return message;
  }

  /**
   * Format duration in minutes to readable format
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours} ชม. ${mins} นาที`;
    }
    return `${mins} นาที`;
  }

  /**
   * Get Thai activity name
   */
  static getActivityName(activityType: string): string {
    const names: Record<string, string> = {
      walking: "เดิน",
      running: "วิ่ง",
      cycling: "ปั่นจักรยาน",
      swimming: "ว่ายน้ำ",
      workout: "ออกกำลังกาย",
      yoga: "โยคะ",
      other: "อื่นๆ",
    };

    return names[activityType] || activityType;
  }

  /**
   * Format activities list for LINE flex message
   */
  static formatActivitiesList(activities: ActivityData[]): string {
    if (activities.length === 0) {
      return "ไม่มีกิจกรรมในช่วงเวลานี้";
    }

    let message = "📋 รายการกิจกรรม\n\n";

    activities.forEach((activity, index) => {
      const activityName = this.getActivityName(activity.activityType);
      const date = new Date(activity.date).toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
      });

      message += `${index + 1}. ${activityName} - ${date}\n`;
      message += `   ⏱ ${this.formatDuration(activity.duration)}`;

      if (activity.distance) {
        message += ` | 📏 ${activity.distance.toFixed(1)} กม.`;
      }

      if (activity.calories) {
        message += ` | 🔥 ${activity.calories.toFixed(0)} kcal`;
      }

      message += "\n\n";
    });

    return message;
  }
}
