import "server-only";
import crypto from "node:crypto";
import { logger } from "../logger";

export interface ScheduledSlot {
  dayOfWeek: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  targetHour: number; // 9 - 17
  targetMinute: number; // 0 - 59
  targetTimeFormatted: string; // e.g. "14:25"
}

export interface WeeklySchedulePlan {
  weekKey: string;
  targetWeeklyCount: number; // 2 or 3 blogs per week
  slots: ScheduledSlot[];
}

export interface ScheduleEvaluationResult {
  shouldGenerate: boolean;
  reason: string;
  weekKey: string;
  weeklyTarget: number;
  scheduledDays: string[];
  todaySlot?: ScheduledSlot;
  isDaytime: boolean;
  currentTimeFormatted: string;
  weeklyUsageRatio: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export class BlogSchedulerService {
  /**
   * Generates ISO week string: "YYYY-Www"
   */
  getIsoWeekKey(date: Date = new Date()): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${year}-W${String(weekNo).padStart(2, "0")}`;
  }

  /**
   * Synthesizes a deterministic pseudo-random weekly plan for the given ISO week:
   * - 2 or 3 blogs per week (randomly assigned for each week)
   * - Distributed across random distinct weekdays in daytime hours (09:00 - 18:00)
   */
  getWeeklyPlan(weekKey: string): WeeklySchedulePlan {
    const hash = crypto.createHash("sha256").update(`blog_schedule:${weekKey}`).digest();

    // 1. Randomly decide target weekly count: 2 or 3 blogs per week
    const targetWeeklyCount = hash[0] % 2 === 0 ? 2 : 3;

    // 2. Select distinct weekdays (Monday=1 through Friday=5, occasionally Saturday=6)
    const candidateDays = [1, 2, 3, 4, 5]; // Mon - Fri
    const shuffledDays: number[] = [];
    const pool = [...candidateDays];

    for (let i = 0; i < pool.length; i++) {
      const idx = hash[i + 1] % pool.length;
      shuffledDays.push(pool.splice(idx, 1)[0]);
    }

    // Pick top 2 or 3 distinct days and sort chronologically
    const selectedDays = shuffledDays.slice(0, targetWeeklyCount).sort((a, b) => a - b);

    // 3. For each selected day, assign a randomized daytime hour (09:00 - 17:00) & minute (10 - 55)
    const slots: ScheduledSlot[] = selectedDays.map((dayIndex, i) => {
      // Daytime window: 9 AM to 5 PM (09:00 - 17:00)
      const hourOffset = hash[i * 3 + 6] % 9; // 0 to 8
      const targetHour = 9 + hourOffset; // 9, 10, 11, 12, 13, 14, 15, 16, 17

      const minuteOffset = hash[i * 3 + 7] % 45; // 0 to 44
      const targetMinute = 10 + minuteOffset; // 10 to 54

      const hourStr = String(targetHour).padStart(2, "0");
      const minStr = String(targetMinute).padStart(2, "0");

      return {
        dayOfWeek: DAY_NAMES[dayIndex],
        dayIndex,
        targetHour,
        targetMinute,
        targetTimeFormatted: `${hourStr}:${minStr}`,
      };
    });

    return {
      weekKey,
      targetWeeklyCount,
      slots,
    };
  }

  /**
   * Evaluates the current schedule against the weekly plan, daytime constraints, and post usage.
   * Logs full schedule, target timing, and decision context.
   */
  evaluateSchedule(
    weeklyPostsUsed: number,
    dailyPostsUsed: number,
    options: { now?: Date; forceDaytime?: boolean } = {},
  ): ScheduleEvaluationResult {
    const now = options.now || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDayIndex = now.getDay();
    const todayName = DAY_NAMES[currentDayIndex];
    const currentTimeFormatted = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    const weekKey = this.getIsoWeekKey(now);
    const plan = this.getWeeklyPlan(weekKey);
    const scheduledDays = plan.slots.map((s) => `${s.dayOfWeek} at ${s.targetTimeFormatted}`);
    const weeklyUsageRatio = `${weeklyPostsUsed}/${plan.targetWeeklyCount}`;

    // Daytime check: 09:00 to 18:00 (9 AM to 6 PM)
    const isDaytime = options.forceDaytime ?? (currentHour >= 9 && currentHour < 18);

    if (!isDaytime) {
      const reason = `Skipped: Outside daytime publishing window (09:00 - 18:00). Current time: ${currentTimeFormatted}.`;
      logger.info("Autonomous blog scheduler: Daytime window check failed", {
        weekKey,
        currentLocalTime: currentTimeFormatted,
        isDaytime: false,
        daytimeWindow: "09:00 - 18:00",
        weeklyTarget: plan.targetWeeklyCount,
        weeklyPostsUsed,
      });

      return {
        shouldGenerate: false,
        reason,
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        scheduledDays,
        isDaytime: false,
        currentTimeFormatted,
        weeklyUsageRatio,
      };
    }

    // Weekly cap check: Max 2 or 3 blogs per week as assigned for this week
    if (weeklyPostsUsed >= plan.targetWeeklyCount) {
      const reason = `Skipped: Weekly randomized publishing target of ${plan.targetWeeklyCount} blogs reached for ${weekKey} (Used: ${weeklyPostsUsed}).`;
      logger.info("Autonomous blog scheduler: Weekly target completed", {
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        weeklyPostsUsed,
        weeklyUsageRatio,
      });

      return {
        shouldGenerate: false,
        reason,
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        scheduledDays,
        isDaytime: true,
        currentTimeFormatted,
        weeklyUsageRatio,
      };
    }

    // Check if today is an allocated publishing day
    const todaySlot = plan.slots.find((s) => s.dayIndex === currentDayIndex);

    if (!todaySlot) {
      const reason = `Skipped: Today (${todayName}) is not an allocated publishing day for ${weekKey}. Scheduled days: ${scheduledDays.join("; ")}.`;
      logger.info("Autonomous blog scheduler: Non-publishing day", {
        weekKey,
        today: todayName,
        scheduledDays,
        weeklyTarget: plan.targetWeeklyCount,
        weeklyUsageRatio,
      });

      return {
        shouldGenerate: false,
        reason,
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        scheduledDays,
        isDaytime: true,
        currentTimeFormatted,
        weeklyUsageRatio,
      };
    }

    // Daily limit check: Only 1 blog generated per scheduled day
    if (dailyPostsUsed >= 1) {
      const reason = `Skipped: Today's blog already generated (daily quota used: ${dailyPostsUsed}/1).`;
      logger.info("Autonomous blog scheduler: Daily slot already consumed", {
        weekKey,
        today: todayName,
        dailyPostsUsed,
        targetTime: todaySlot.targetTimeFormatted,
      });

      return {
        shouldGenerate: false,
        reason,
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        scheduledDays,
        todaySlot,
        isDaytime: true,
        currentTimeFormatted,
        weeklyUsageRatio,
      };
    }

    // Daytime timing check: Has the randomized daytime trigger time arrived?
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = todaySlot.targetHour * 60 + todaySlot.targetMinute;

    if (currentTotalMinutes < targetTotalMinutes) {
      const remainingMinutes = targetTotalMinutes - currentTotalMinutes;
      const reason = `Waiting: Today's randomized daytime trigger is at ${todaySlot.targetTimeFormatted} (${remainingMinutes} minutes remaining).`;
      logger.info("Autonomous blog scheduler: Waiting for randomized daytime trigger slot", {
        weekKey,
        today: todayName,
        targetTime: todaySlot.targetTimeFormatted,
        currentTime: currentTimeFormatted,
        remainingMinutes,
      });

      return {
        shouldGenerate: false,
        reason,
        weekKey,
        weeklyTarget: plan.targetWeeklyCount,
        scheduledDays,
        todaySlot,
        isDaytime: true,
        currentTimeFormatted,
        weeklyUsageRatio,
      };
    }

    // Matched! Current time is at or past today's randomized daytime trigger
    const reason = `Triggered: Matched randomized daytime slot for ${todayName} at ${todaySlot.targetTimeFormatted} (Current: ${currentTimeFormatted}).`;
    logger.info("Autonomous blog scheduler: Trigger condition matched", {
      weekKey,
      weeklyTarget: plan.targetWeeklyCount,
      today: todayName,
      scheduledTime: todaySlot.targetTimeFormatted,
      currentTime: currentTimeFormatted,
      weeklyUsageRatio,
      decision: "EXECUTE_AUTONOMOUS_GENERATION",
    });

    return {
      shouldGenerate: true,
      reason,
      weekKey,
      weeklyTarget: plan.targetWeeklyCount,
      scheduledDays,
      todaySlot,
      isDaytime: true,
      currentTimeFormatted,
      weeklyUsageRatio,
    };
  }
}
