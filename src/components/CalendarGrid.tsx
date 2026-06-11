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
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

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
    <div id="calendar-grid-card" className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            {yearStr && monthStr ? (
              <span className="font-mono text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded-xl border border-indigo-100/50 text-base">
                {yearStr} 年 {monthStr} 月
              </span>
            ) : null}
            日历排班表
            <span className="text-xs font-normal text-gray-400 flex items-center gap-0.5 group relative cursor-pointer">
              <HelpCircle size={14} className="text-gray-300 hover:text-gray-400 transition-colors" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[11px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 leading-relaxed shadow-lg z-20">
                点击任意日期格子，可一键切换“上班”或“休假”状态，灵活匹配公司个性化排班安排。
              </span>
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1.5">灰色为需要出勤的工作日，彩色卡片为国家法定或周末节假日（可点击自定义）。</p>
        </div>

        {hasOverrides && (
          <button
            id="reset-calendar-button"
            onClick={onResetOverrides}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 rounded-xl transition-all cursor-pointer font-medium self-start sm:self-auto"
          >
            <RefreshCw size={13} className="animate-spin-hover" />
            重置自定义天
          </button>
        )}
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {weekdays.map((wk, i) => (
          <div
            key={wk}
            className={`text-xs font-semibold py-2 ${
              i === 0 || i === 6 ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {wk}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* 空白填充单元格 */}
        {Array.from({ length: emptyCells }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 rounded-2xl border border-dashed border-gray-100" />
        ))}

        {/* 实际日期渲染 */}
        {days.map((day) => {
          // 下面决定格子的样式
          const isToday = new Date().toDateString() === new Date(day.date).toDateString();
          
          let cellStyle = "bg-white border border-gray-100 text-gray-800 hover:border-indigo-200 hover:shadow-sm";
          let labelText = day.name;
          let dotStyle = "";

          if (day.isWorkday) {
            // 工作日
            if (day.isCustom) {
              cellStyle = "bg-orange-50/50 border border-orange-200 hover:border-orange-300 text-orange-900";
              labelText = "调班上班";
              dotStyle = "bg-orange-500";
            } else if (day.isWeekend) {
              // 周末补班/调休工作日
              cellStyle = "bg-indigo-50/40 border border-indigo-200 hover:border-indigo-300 text-indigo-950 font-medium";
              labelText = day.name || "调休班";
              dotStyle = "bg-indigo-500";
            } else {
              // 普通周一至周五工作日
              cellStyle = "bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm text-gray-800";
              dotStyle = "bg-gray-300";
            }
          } else {
            // 休息放假日
            if (day.isCustom) {
              cellStyle = "bg-amber-50 border border-amber-200 hover:border-amber-300 text-amber-900 font-medium";
              labelText = "自定义休";
              dotStyle = "bg-amber-400";
            } else if (day.isWeekend && day.name === "周末") {
              // 普通周末
              cellStyle = "bg-emerald-50/20 border border-emerald-100 hover:border-emerald-200 text-emerald-800";
              labelText = "周末休息";
              dotStyle = "bg-emerald-300";
            } else {
              // 法定节日放假（红事或绿事）
              cellStyle = "bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-950 font-semibold";
              labelText = day.name || "国配休";
              dotStyle = "bg-emerald-600";
            }
          }

          if (isToday) {
            cellStyle += " ring-3 ring-indigo-500/30 border-indigo-500 scale-[1.02] shadow-sm z-10";
          }

          return (
            <button
              key={day.date}
              id={`calendar-day-${day.dayOfMonth}`}
              onClick={() => onToggleDay(day.date)}
              className={`aspect-square sm:aspect-auto sm:h-20 rounded-2xl flex flex-col justify-between p-2.5 transition-all duration-200 text-left select-none relative group ${cellStyle}`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-sm sm:text-base font-semibold ${isToday ? "text-indigo-600 font-extrabold" : ""}`}>
                  {day.dayOfMonth}
                </span>
                
                {/* 状态圆点 */}
                <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
              </div>

              {/* 移动端简洁标，网页端文字描述 */}
              <div className="hidden sm:block mt-1">
                <p className="text-[10px] truncate max-w-full font-normal opacity-85">
                  {labelText}
                </p>
              </div>

              {/* 今天标记 */}
              {isToday && (
                <div className="absolute top-1 right-3 text-[9px] font-bold text-indigo-600/90 tracking-wider">
                  TODAY
                </div>
              )}

              {/* 用户自定义提示图标 */}
              {day.isCustom && (
                <span className="absolute bottom-1 right-1.5 text-[8px] bg-amber-400 text-white font-extrabold px-1 rounded-sm leading-none transform scale-90">
                  改
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 pt-5 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-white border border-gray-100 shadow-sm" />
          <span>标准工作日</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-100" />
          <span>法定节假日/双休</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-50/40 border border-indigo-200" />
          <span>调休上班/补班</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200" />
          <span>自定义改动</span>
        </div>
      </div>
    </div>
  );
};
