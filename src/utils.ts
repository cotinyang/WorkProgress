/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HolidayItem, DayStatus, WorkHoursConfig, MonthProgressResult } from "./types";

// 格式化日期为 YYYY-MM-DD
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 获取某一天的周几名称
export function getDayOfWeekName(dayOfWeek: number): string {
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return names[dayOfWeek];
}

// 解析 "HH:MM" 为自 00:00 来的分钟数
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// 生成某个月份的所有日期状态
export function generateMonthDays(
  year: number,
  month: number, // 1-12
  holidayList: HolidayItem[]
): DayStatus[] {
  const days: DayStatus[] = [];
  const totalDays = new Date(year, month, 0).getDate(); // 获取该月总天数

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dateStr = formatDateStr(dateObj);
    const dayOfWeek = dateObj.getDay(); // 0-6
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 查找是否在节假日列表里
    const holidayMatch = holidayList.find((item) => item.date === dateStr);

    let isWorkday = !isWeekend; // 默认：周一至周五上班
    let isHoliday = isWeekend;  // 默认：周末休息
    let name = isWeekend ? "周末" : "工作日";
    let isCustom = false;

    if (holidayMatch) {
      isHoliday = holidayMatch.isHoliday;
      isWorkday = !holidayMatch.isHoliday;
      name = holidayMatch.name;
      isCustom = !!holidayMatch.isCustom;
    }

    days.push({
      date: dateStr,
      dayOfMonth: d,
      dayOfWeek,
      isWorkday,
      isHoliday,
      isWeekend,
      name,
      isCustom,
    });
  }

  return days;
}

// 计算某月进度详情，精确到秒级，提供极佳的实时时间流逝呈现
export function calculateMonthProgress(
  days: DayStatus[],
  config: WorkHoursConfig,
  currentTime: Date
): MonthProgressResult {
  const startSecs = parseTimeToMinutes(config.startTime) * 60;
  const endSecs = parseTimeToMinutes(config.endTime) * 60;
  const breakStartSecs = parseTimeToMinutes(config.breakStartTime) * 60;
  const breakEndSecs = parseTimeToMinutes(config.breakEndTime) * 60;

  // 获取工作时间区间划分
  const getWorkSegments = () => {
    if (config.enableBreak) {
      return [
        { s: startSecs, e: breakStartSecs },
        { s: breakEndSecs, e: endSecs }
      ];
    }
    return [{ s: startSecs, e: endSecs }];
  };

  const segments = getWorkSegments();
  const dailyWorkSecondsTotal = segments.reduce((sum, seg) => sum + Math.max(0, seg.e - seg.s), 0);

  let totalWorkDays = 0;
  let completedWorkDays = 0;
  let remainingWorkDays = 0;

  let totalWorkSeconds = 0;
  let completedWorkSeconds = 0;
  let remainingWorkSeconds = 0;
  let endOfDayCompletedWorkSeconds = 0;

  let todayWorkSecondsTotal = 0;
  let todayWorkSecondsRemaining = 0;
  let todayWorkSecondsCompleted = 0;
  let isTodayWorkday = false;

  const currentYear = currentTime.getFullYear();
  const currentMonth = currentTime.getMonth() + 1; // 1-12
  const currentDay = currentTime.getDate();
  const currentTotalSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

  days.forEach((day) => {
    const [y, m, d] = day.date.split("-").map(Number);
    const isBeforeToday = y < currentYear || (y === currentYear && m < currentMonth) || (y === currentYear && m === currentMonth && d < currentDay);
    const isAfterToday = y > currentYear || (y === currentYear && m > currentMonth) || (y === currentYear && m === currentMonth && d > currentDay);
    const isToday = y === currentYear && m === currentMonth && d === currentDay;

    if (day.isWorkday) {
      totalWorkDays += 1;
      totalWorkSeconds += dailyWorkSecondsTotal;

      if (isBeforeToday) {
        completedWorkDays += 1;
        completedWorkSeconds += dailyWorkSecondsTotal;
        endOfDayCompletedWorkSeconds += dailyWorkSecondsTotal;
      } else if (isAfterToday) {
        remainingWorkDays += 1;
        remainingWorkSeconds += dailyWorkSecondsTotal;
      } else if (isToday) {
        isTodayWorkday = true;
        todayWorkSecondsTotal = dailyWorkSecondsTotal;
        endOfDayCompletedWorkSeconds += dailyWorkSecondsTotal;

        // 精确计算今天到当前秒数已消耗的工作秒数
        let comp = 0;
        segments.forEach((seg) => {
          if (currentTotalSeconds <= seg.s) {
            comp += 0;
          } else if (currentTotalSeconds >= seg.e) {
            comp += (seg.e - seg.s);
          } else {
            comp += (currentTotalSeconds - seg.s);
          }
        });

        const rem = Math.max(0, dailyWorkSecondsTotal - comp);

        todayWorkSecondsCompleted = comp;
        todayWorkSecondsRemaining = rem;
        
        completedWorkSeconds += comp;
        remainingWorkSeconds += rem;

        // 如果今天已经完全下班/或还未开始
        if (comp === dailyWorkSecondsTotal) {
          completedWorkDays += 1;
        } else if (rem === dailyWorkSecondsTotal) {
          remainingWorkDays += 1;
        } else {
          // 将今天正在进行的时间点折算为极佳的精度比例
          completedWorkDays += (comp / dailyWorkSecondsTotal);
          remainingWorkDays += (rem / dailyWorkSecondsTotal);
        }
      }
    }
  });

  // 如果当月完全没有工作安排
  if (totalWorkSeconds === 0) {
    return {
      totalWorkDays: 0,
      completedWorkDays: 0,
      remainingWorkDays: 0,
      totalWorkMinutes: 0,
      completedWorkMinutes: 0,
      remainingWorkMinutes: 0,
      progressPercent: 0,
      remainingPercent: 100,
      endOfDayProgressPercent: 0,
      endOfDayCompletedWorkMinutes: 0,
      todayWorkMinutesTotal: 0,
      todayWorkMinutesRemaining: 0,
      todayWorkMinutesCompleted: 0,
      isTodayWorkday: false,
    };
  }

  const progressPercent = Number(((completedWorkSeconds / totalWorkSeconds) * 100).toFixed(4));
  const remainingPercent = Number(((remainingWorkSeconds / totalWorkSeconds) * 100).toFixed(4));
  const endOfDayProgressPercent = Number(((endOfDayCompletedWorkSeconds / totalWorkSeconds) * 100).toFixed(4));

  return {
    totalWorkDays: Number(totalWorkDays.toFixed(4)),
    completedWorkDays: Number(completedWorkDays.toFixed(4)),
    remainingWorkDays: Number(remainingWorkDays.toFixed(4)),
    totalWorkMinutes: Number((totalWorkSeconds / 60).toFixed(2)),
    completedWorkMinutes: Number((completedWorkSeconds / 60).toFixed(2)),
    remainingWorkMinutes: Number((remainingWorkSeconds / 60).toFixed(2)),
    progressPercent,
    remainingPercent,
    endOfDayProgressPercent,
    endOfDayCompletedWorkMinutes: Number((endOfDayCompletedWorkSeconds / 60).toFixed(2)),
    todayWorkMinutesTotal: Number((todayWorkSecondsTotal / 60).toFixed(2)),
    todayWorkMinutesRemaining: Number((todayWorkSecondsRemaining / 60).toFixed(2)),
    todayWorkMinutesCompleted: Number((todayWorkSecondsCompleted / 60).toFixed(2)),
    isTodayWorkday,
  };
}
