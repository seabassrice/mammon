"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Asset } from "@/lib/types";
import {
  formatCurrency,
} from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Package, DollarSign, Calendar, TrendingUp } from "lucide-react";

const CHART_COLORS = {
  physical: "#3B82F6",
  digital_game: "#8B5CF6",
  subscription: "#F97316",
};

interface DashboardChartsProps {
  assets: Asset[];
}

export function DashboardCharts({ assets }: DashboardChartsProps) {
  // 统计数据
  const totalCount = assets.length;
  const totalPrice = assets.reduce((sum, a) => sum + (a.price || 0), 0);
  const expiringCount = assets.filter((a) => {
    if (a.type !== "subscription") return false;
    if (a.billingCycle === "once") return false;
    if (!a.nextBillingDate) return false;
    const nextBilling = new Date(a.nextBillingDate);
    if (isNaN(nextBilling.getTime())) return false;
    const today = new Date();
    const diffDays = (nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const avgPrice = totalCount > 0 ? totalPrice / totalCount : 0;

  // 类型分布
  const typeData = [
    {
      name: "实物",
      value: assets.filter((a) => a.type === "physical").length,
      color: CHART_COLORS.physical,
    },
    {
      name: "游戏/虚拟",
      value: assets.filter((a) => a.type === "digital_game").length,
      color: CHART_COLORS.digital_game,
    },
    {
      name: "订阅",
      value: assets.filter((a) => a.type === "subscription").length,
      color: CHART_COLORS.subscription,
    },
  ].filter((d) => d.value > 0);

  // 类别统计
  const categoryMap = new Map<string, { count: number; total: number }>();
  assets.forEach((a) => {
    const key = a.category || "未分类";
    const current = categoryMap.get(key) || { count: 0, total: 0 };
    categoryMap.set(key, {
      count: current.count + 1,
      total: current.total + (a.price || 0),
    });
  });
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      数量: data.count,
      金额: data.total,
    }))
    .sort((a, b) => b.数量 - a.数量)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">资产总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              已记录 {totalCount} 项资产
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总价值</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrice)}</div>
            <p className="text-xs text-muted-foreground">
              所有资产累计金额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">即将到期</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              7天内需续费订阅
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均单价</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              每项资产平均价值
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 类型分布饼图 */}
        <Card>
          <CardHeader>
            <CardTitle>资产类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 项`, "数量"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 类别柱状图 */}
        <Card>
          <CardHeader>
            <CardTitle>类别统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="数量" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="金额" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}