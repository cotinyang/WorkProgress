/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DayStatus } from "../types";
import { getDayOfWeekName } from "../utils";
import { HelpCircle, RefreshCw } from "lucide-react";

interface CalendarGridProps {
  days: DayStatus[];
  onToggleDay: (dateStr: string) => void;
  onResetOverrides: () => void;
  hasOverrides: boolean;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  onToggleDay,
  onResetOverrides,
  hasOverrides,
}) => {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // 得出日历中第一天前面的空白格数
  const firstDayObj = days[0] ? new Date(days[0].date) : new Date();
  const emptyCells = firstDayObj.getDay();

  // 智能解析年份和月份展示
  let yearStr = "";
  let monthStr = "";
  if (days.length > 0) {
    const parts = days[0].date.split("-");
    yearStr = parts[0];
    monthStr = parts[1];
    if (monthStr.startsWith("0")) {
      monthStr = monthStr.substring(1);
    }
  }

  return (
    <div id="calendar-grid-card" className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            {yearStr && monthStr ? (
              <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50 text-base">
                {yearStr} - {monthStr.padStart(2, "0")}
              </span>
            ) : null}
            Calendar Schedule
            <span className="text-xs font-normal text-gray-400 dark:text-slate-500 flex items-center gap-0.5 group relative cursor-pointer">
              <HelpCircle size={14} className="text-gray-300 dark:text-slate-600 hover:text-gray-400 dark:hover:text-slate-500 transition-colors" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 dark:bg-slate-950 text-white dark:text-slate-200 text-[11px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 leading-relaxed shadow-lg dark:border dark:border-slate-800 z-20">
                Click any calendar cell to toggle between "Workday" and "Leave" to match your customized schedule.
              </span>
            </span>
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">Gray cards represent workdays. Colored cards represent official holidays or weekends (click to customize).</p>
        </div>

        {hasOverrides && (
          <button
            id="reset-calendar-button"
            onClick={onResetOverrides}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer font-medium self-start sm:self-auto"
          >
            <RefreshCw size={13} className="animate-spin-hover" />
            Reset Custom Days
          </button>
        )}
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {weekdays.map((wk, i) => (
          <div
            key={wk}
            className={`text-xs font-semibold py-2 ${
              i === 0 || i === 6 ? "text-gray-400 dark:text-slate-500" : "text-gray-500 dark:text-slate-400"
            }`}
          >
            {wk}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Empty cells padding */}
        {Array.from({ length: emptyCells }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-gray-100 dark:border-slate-800/60" />
        ))}

        {/* Date cells rendering */}
        {days.map((day) => {
          const isToday = new Date().toDateString() === new Date(day.date).toDateString();
          
          let cellStyle = "bg-white border border-gray-100 text-gray-800 hover:border-indigo-200 hover:shadow-sm";
          let labelText = day.name;
          let dotStyle = "";

          if (day.isWorkday) {
            // Workday
            if (day.isCustom) {
              cellStyle = "bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 hover:border-orange-300 dark:hover:border-orange-800 text-orange-900 dark:text-orange-300";
              labelText = "Adj. Workday";
              dotStyle = "bg-orange-500";
            } else if (day.isWeekend) {
              // Weekend makeup workday
              cellStyle = "bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-800 text-indigo-950 dark:text-indigo-300 font-medium";
              labelText = day.name || "Adj. Workday";
              dotStyle = "bg-indigo-500";
            } else {
              // Normal weekday workday
              cellStyle = "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-sm text-gray-800 dark:text-slate-200";
              dotStyle = "bg-gray-300 dark:bg-slate-700";
            }
          } else {
            // Holiday / Leave
            if (day.isCustom) {
              cellStyle = "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800 text-amber-900 dark:text-amber-300 font-medium";
              labelText = "Custom Leave";
              dotStyle = "bg-amber-400";
            } else if (day.isWeekend && day.name === "Weekend") {
              // Standard weekend
              cellStyle = "bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800 text-emerald-800 dark:text-emerald-400";
              labelText = "Weekend";
              dotStyle = "bg-emerald-300 dark:bg-emerald-700";
            } else {
              // Official holiday
              cellStyle = "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800 text-emerald-950 dark:text-emerald-300 font-semibold";
              labelText = day.name || "Holiday";
              dotStyle = "bg-emerald-600 dark:bg-emerald-500";
            }
          }

          if (isToday) {
            cellStyle += " ring-3 ring-indigo-500/30 dark:ring-indigo-500/20 border-indigo-500 scale-[1.02] shadow-sm z-10";
          }

          return (
            <button
              key={day.date}
              id={`calendar-day-${day.dayOfMonth}`}
              onClick={() => onToggleDay(day.date)}
              className={`aspect-square sm:aspect-auto sm:h-20 rounded-2xl flex flex-col justify-between p-2.5 transition-all duration-200 text-left select-none relative group ${cellStyle}`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-sm sm:text-base font-semibold ${isToday ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : ""}`}>
                  {day.dayOfMonth}
                </span>
                
                <div className="flex items-center gap-1.5">
                  {isToday && (
                    <span className="text-[9px] font-bold text-indigo-600/95 dark:text-indigo-400 tracking-wider leading-none">
                      TODAY
                    </span>
                  )}
                  {/* Status Dot */}
                  <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
                </div>
              </div>

              {/* Status label (desktop only) */}
              <div className="hidden sm:block mt-1">
                <p className="text-[10px] truncate max-w-full font-normal opacity-85">
                  {labelText}
                </p>
              </div>

              {/* Custom override indicator */}
              {day.isCustom && (
                <span className="absolute bottom-1 right-1.5 text-[8px] bg-amber-400 text-white font-extrabold px-1 rounded-sm leading-none transform scale-90">
                  M
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 pt-5 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm" />
          <span>Standard Workday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50" />
          <span>Official Holiday / Weekend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50" />
          <span>Adjusted Workday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200" />
          <span>Custom Overrides</span>
        </div>
      </div>
    </div>
  );
};
