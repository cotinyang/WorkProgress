/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { HolidayItem, WorkHoursConfig } from "./types";
import { DEFAULT_HOLIDAYS_PRESET } from "./constants";
import { generateMonthDays, calculateMonthProgress, formatDateStr } from "./utils";
import { CalendarGrid } from "./components/CalendarGrid";
import { ProgressBar } from "./components/ProgressBar";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Layers, ShieldCheck, CheckSquare, Clock } from "lucide-react";

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 1. 初始化年份和月份为当前本地时间
  const [selectedYear, setSelectedYear] = useState<number>(currentTime.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentTime.getMonth() + 1);

  // 2. 初始化考勤时间配置
  const [workHours, setWorkHours] = useState<WorkHoursConfig>(() => {
    const saved = localStorage.getItem("work_hours_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 如果是从旧版本残留的13:30，自动校准为精确午休时间 13:00
        if (parsed.breakEndTime === "13:30") {
          parsed.breakEndTime = "13:00";
        }
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return {
      startTime: "09:00",
      endTime: "18:00",
      enableBreak: true,
      breakStartTime: "12:00",
      breakEndTime: "13:00",
    };
  });

  // 3. 从 localStorage 读取或初始化节假日数据库（含系统预置和远程下载）
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => {
    const saved = localStorage.getItem("holidays_database");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_HOLIDAYS_PRESET;
  });

  // 4. 用户手动在日历上自定义的日期改动
  const [customOverrides, setCustomOverrides] = useState<Record<string, { isHoliday: boolean; name: string }>>(() => {
    const saved = localStorage.getItem("custom_overrides");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {};
  });

  // 5. 同步相关状态
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncTime, setSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("holidays_sync_time") || null;
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  // 6. 心跳更新：每一秒触发一次状态修正，实现毫秒/秒级流逝动画
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 持久化工作时间配置
  useEffect(() => {
    localStorage.setItem("work_hours_config", JSON.stringify(workHours));
  }, [workHours]);

  // 持久化自定义更改
  useEffect(() => {
    localStorage.setItem("custom_overrides", JSON.stringify(customOverrides));
  }, [customOverrides]);

  // 持久化节假日主数据库
  useEffect(() => {
    localStorage.setItem("holidays_database", JSON.stringify(holidays));
  }, [holidays]);

  // 7. 合并【主节假日数据】与【用户自定义覆写】
  const fullyMergedHolidays = useMemo(() => {
    const map = new Map<string, HolidayItem>();
    
    // 首先添加预设/同步的官方数据
    holidays.forEach(item => {
      map.set(item.date, { ...item });
    });

    // 叠加用户的自定义更改
    Object.keys(customOverrides).forEach(dateStr => {
      const override = customOverrides[dateStr];
      map.set(dateStr, {
        date: dateStr,
        isHoliday: override.isHoliday,
        name: override.name,
        isCustom: true
      });
    });

    return Array.from(map.values());
  }, [holidays, customOverrides]);

  // 8. 生成所选月份的全部天列表
  const daysOfSelectedMonth = useMemo(() => {
    return generateMonthDays(selectedYear, selectedMonth, fullyMergedHolidays);
  }, [selectedYear, selectedMonth, fullyMergedHolidays]);

  // 9. 计算当月排班统计与高精度流逝比
  const progressOfSelectedMonth = useMemo(() => {
    return calculateMonthProgress(daysOfSelectedMonth, workHours, currentTime);
  }, [daysOfSelectedMonth, workHours, currentTime]);

  // 10. 月份与年份切换控制器
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(v => v - 1);
    } else {
      setSelectedMonth(v => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(v => v + 1);
    } else {
      setSelectedMonth(v => v + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // 11. 手动点击日历盒子：一键切换工作日与休息日
  const handleToggleDay = (dateStr: string) => {
    // 找出该天原本的排班
    const matchedDay = daysOfSelectedMonth.find(d => d.date === dateStr);
    if (!matchedDay) return;

    const currentlyIsWorkday = matchedDay.isWorkday;

    // 翻转逻辑：如果以前是工作日，现在改成休息日；如果以前是休息日，现在改成工作日
    setCustomOverrides(current => {
      const updated = { ...current };

      if (updated[dateStr]) {
        // 如果之前已经自定义覆盖过，删除它以返回到默认模式
        delete updated[dateStr];
      } else {
        // 否则建立新覆写：翻转状态
        updated[dateStr] = {
          isHoliday: currentlyIsWorkday, // 原来是工作日（isHoliday: false），现在变成节假日（isHoliday: true）
          name: currentlyIsWorkday ? "手动调休休" : "手动调休班"
        };
      }

      return updated;
    });
  };

  // 12. 清除全部自定义微调
  const handleResetOverrides = () => {
    if (confirm("确定要清空您在这个月（或全部时间）上手动修改的所有假期吗？")) {
      setCustomOverrides({});
    }
  };

  // 13. 调用 Timor.tech API 同步国家法定节假日
  const handleSyncHolidays = async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch(`https://timor.tech/api/holiday/year/${selectedYear}`);
      if (!response.ok) {
        throw new Error(`服务器返回异常状态码: ${response.status}`);
      }
      
      const payload = await response.json();
      if (payload.code !== 0) {
        throw new Error(payload.msg || `API返回错误代码: ${payload.code}`);
      }

      const fetchedHolidays: HolidayItem[] = [];
      const holidayData = payload.holiday || {};

      Object.keys(holidayData).forEach(key => {
        const detail = holidayData[key];
        fetchedHolidays.push({
          date: detail.date, // e.g. "2026-01-01"
          isHoliday: detail.holiday, // true=放假, false=补班
          name: detail.name || "节假日",
        });
      });

      if (fetchedHolidays.length === 0) {
        throw new Error("抓取到的节假日列表数据为空，可能是本年尚未公布或数据源尚未收录！");
      }

      // 合并到本地：保留非此年份的已有非自定义数据
      setHolidays(currentLocal => {
        const filteredCurrent = currentLocal.filter(item => {
          const itemYear = Number(item.date.split("-")[0]);
          return itemYear !== selectedYear; // 过滤掉本年旧数据
        });
        return [...filteredCurrent, ...fetchedHolidays];
      });

      const nowStr = new Date().toLocaleString("zh-CN");
      setSyncTime(nowStr);
      localStorage.setItem("holidays_sync_time", nowStr);
    } catch (err: any) {
      console.error("Sync Error:", err);
      setSyncError(err?.message || "网络请求失败，请确保网络通畅后重试。");
    } finally {
      setIsSyncing(false);
    }
  };

  // 判断是否已含有自定义修改
  const hasOverrides = Object.keys(customOverrides).length > 0;

  return (
    <div id="main-root-container" className="min-h-screen bg-slate-50/70 text-gray-800 font-sans tracking-tight pb-16 antialiased">
      {/* 顶部通栏导航 */}
      <header id="top-portal-header" className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5 leading-none">
                工作进度
              </h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                剔除法定节假日 · 调休智能补偿 · 精确度万分之一
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 顶栏北京实时时间看板 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100/80 rounded-xl">
              <Clock size={13} className="text-gray-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-gray-400 leading-none">BEIJING TIME</span>
                <span className="text-xs font-semibold text-gray-700 font-mono mt-0.5 leading-none">
                  {currentTime.toLocaleTimeString("zh-CN", { hour12: false })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主页面宽度局约束 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* 顶部高精度主图表/进度指示器 */}
        <ProgressBar
          progress={progressOfSelectedMonth}
        />

        {/* 下方排班明细日历 */}
        <CalendarGrid
          days={daysOfSelectedMonth}
          onToggleDay={handleToggleDay}
          onResetOverrides={handleResetOverrides}
          hasOverrides={hasOverrides}
        />
      </main>
    </div>
  );
}
