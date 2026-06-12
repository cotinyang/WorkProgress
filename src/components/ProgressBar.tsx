/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MonthProgressResult } from "../types";
import { motion } from "motion/react";
import { Wallet } from "lucide-react";

interface ProgressBarProps {
  progress: MonthProgressResult;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // 计算进度圆环 SVG 属性 (展示已用工作时间比)
  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  
  const progressRate = progress.progressPercent / 100;
  const strokeDashoffsetCompleted = circumference - (progressRate * circumference);

  // 计算已使用额度 $1500 * 进度百分比
  const usedAmount = (1500 * progress.progressPercent / 100).toFixed(2);

  return (
    <div id="progress-container-card" className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8 flex flex-col md:flex-row items-center justify-around gap-8 transition-all relative overflow-hidden">
      {/* 渐变氛围装饰 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50/10 rounded-full blur-3xl -z-10" />

      {/* 环形出勤时间进度 */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          当月工作时间已过进度
        </span>

        <div id="svg-dial-container" className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* 灰色底线圈 */}
            <circle
              cx="104"
              cy="104"
              r={radius}
              stroke="#f3f4f6"
              strokeWidth={stroke}
              fill="transparent"
            />
            {/* 已完成的工作时间高亮环（靛蓝色） */}
            <motion.circle
              cx="104"
              cy="104"
              r={radius}
              stroke="#4f46e5"
              strokeWidth={stroke + 1}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffsetCompleted }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* 圆环正中间显示完成进度数字 */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <motion.span
              id="progress-percent-value"
              className="text-4xl font-black text-gray-950 tracking-tight"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {progress.progressPercent.toFixed(1)}%
            </motion.span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              PROGRESS
            </span>
          </div>
        </div>

        {/* 增加一个显示“下班后预计”的数据 */}
        <div className="mt-4 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-2xl">
          今日下班后预计可达: <span className="font-bold text-gray-800">{progress.endOfDayProgressPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* 核心额度看板 */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left py-4 px-6 md:border-l md:border-gray-100 min-w-[260px] md:pl-12">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center md:justify-start">
          <Wallet size={14} className="text-indigo-500" />
          当月可用额度
        </span>
        
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-5xl font-black text-indigo-950 tracking-tight leading-none">
            ${usedAmount}
          </span>
          <span className="text-sm font-extrabold text-indigo-600 tracking-wider">USD</span>
        </div>

        {/* 核心工作日及每日额度数据 */}
        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-[11px] font-bold text-gray-500">
            工作日: <span className="font-mono text-gray-900">{progress.totalWorkDays}天</span>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-xl px-2.5 py-1 text-[11px] font-bold text-indigo-800">
            每天可用额度: <span className="font-mono text-indigo-950">${(1500 / progress.totalWorkDays).toFixed(2)} USD</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          工作时间：<strong className="text-gray-600 font-mono">09:00 - 18:00</strong>（午休 12:00 - 13:00）
          <br />
          计算方式：依据当月剔除节假日后，按每秒时间流逝及额度上限 <strong className="text-gray-600">$1,500.00 USD</strong> 极速同步。
        </p>

        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between w-full text-[11px] font-medium text-indigo-800 bg-indigo-50/50 border border-indigo-100/50 px-3 py-2 rounded-xl">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            今日下班后预计可用
          </span>
          <span className="font-bold tracking-tight">
            ${(1500 * progress.endOfDayProgressPercent / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
