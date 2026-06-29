import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(dateStr: string, days: number = 7): boolean {
  const remaining = getDaysUntil(dateStr);
  return remaining >= 0 && remaining <= days;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_use: "在用",
    idle: "闲置",
    reselling: "转卖",
    discarded: "丢弃",
    donated: "赠送",
  };
  return labels[status] || status;
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    Steam: "Steam",
    Epic: "Epic",
    PS: "PlayStation",
    Xbox: "Xbox",
    Other: "其他",
  };
  return labels[platform] || platform;
}

export function getCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    monthly: "月付",
    yearly: "年付",
    custom: "自定义",
    once: "永久/一次性",
  };
  return labels[cycle] || cycle;
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    physical: "实物",
    digital_game: "游戏/虚拟",
    subscription: "订阅",
  };
  return labels[type] || type;
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    physical: "bg-zinc-500",
    digital_game: "bg-purple-500",
    subscription: "bg-blue-500",
  };
  return colors[type] || "bg-gray-500";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_use: "bg-green-500",
    idle: "bg-yellow-500",
    reselling: "bg-blue-500",
    discarded: "bg-gray-500",
    donated: "bg-pink-500",
  };
  return colors[status] || "bg-gray-500";
}