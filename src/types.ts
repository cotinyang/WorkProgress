/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HolidayItem {
  date: string;       // YYYY-MM-DD
  isHoliday: boolean; // true = 放假/休息日, false = 调休/上班工作日
  name: string;       // e.g. "春节", "国庆节后补班"
  isCustom?: boolean; // 用户自定义/手动修改
}

export interface DayStatus {
  date: string;       // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;  // 0 = Sunday, 6 = Saturday
  isWorkday: boolean; // 是否为工作日 (考虑周末、法定节假日与调休补班)
  isHoliday: boolean; // 是否为放假日
  isWeekend: boolean; // 是否是周末 (六、日)
  name: string;       // 节日名称或状态描述
  isCustom?: boolean; // 是否被用户自定义覆写
}

export interface WorkHoursConfig {
  startTime: string;       // "09:00"
  endTime: string;         // "18:00"
  enableBreak: boolean;    // 是否有午休
  breakStartTime: string;  // "12:00"
  breakEndTime: string;    // "13:30"
}

export interface MonthProgressResult {
  totalWorkDays: number;
  completedWorkDays: number;
  remainingWorkDays: number;
  
  totalWorkMinutes: number;
  completedWorkMinutes: number;
  remainingWorkMinutes: number;
  
  progressPercent: number; // 已经过去的工作时间百分比
  remainingPercent: number; // 剩余的工作时间百分比
  
  endOfDayProgressPercent: number; // 今日下班后的总进度
  endOfDayCompletedWorkMinutes: number; // 今日下班后的已工作分钟数

  todayWorkMinutesTotal: number;
  todayWorkMinutesRemaining: number;
  todayWorkMinutesCompleted: number;
  isTodayWorkday: boolean;
}
