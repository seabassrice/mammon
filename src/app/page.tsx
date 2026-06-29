"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllAssets } from "@/lib/data-service";
import type { Asset, SubscriptionAsset } from "@/lib/types";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  isExpiringSoon,
  getCycleLabel,
} from "@/lib/utils";
import {
  Plus,
  Calendar,
  Package,
  Gamepad2,
  Repeat,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAllAssets();
        setAssets(data);
      } catch (error) {
        console.error("加载资产失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 即将到期的订阅（排除永久订阅）
  const expiringSubscriptions = assets.filter((a) => {
    if (a.type !== "subscription") return false;
    if (a.billingCycle === "once") return false;
    const sub = a as SubscriptionAsset;
    return isExpiringSoon(sub.nextBillingDate, 7);
  }) as SubscriptionAsset[];

  // 最近添加的资产
  const recentAssets = [...assets]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">概览</h1>
          <p className="text-muted-foreground mt-1">
            欢迎使用 Mammon，管理你的所有资产
          </p>
        </div>
        <Link href="/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增资产
          </Button>
        </Link>
      </div>

      {/* 空状态 */}
      {assets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">还没有任何资产</h3>
            <p className="mt-2 text-muted-foreground">
              点击&ldquo;新增资产&rdquo;开始记录你的第一件物品
            </p>
            <Link href="/add" className="mt-4 inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增资产
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 图表和统计 */}
          <DashboardCharts assets={assets} />

          {/* 即将到期的订阅 */}
          {expiringSubscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  即将到期的订阅
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringSubscriptions.map((sub) => {
                    const days = getDaysUntil(sub.nextBillingDate);
                    return (
                      <Link
                        key={sub.id}
                        href={`/assets/${sub.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{sub.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {getCycleLabel(sub.billingCycle)} ·{" "}
                              {formatCurrency(sub.price)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={days <= 3 ? "destructive" : "secondary"}
                        >
                          {days === 0
                            ? "今天到期"
                            : `${days} 天后到期`}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 最近添加 */}
          {recentAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>最近添加</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAssets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {asset.type === "physical" && (
                          <Package className="h-5 w-5 text-zinc-500" />
                        )}
                        {asset.type === "digital_game" && (
                          <Gamepad2 className="h-5 w-5 text-purple-500" />
                        )}
                        {asset.type === "subscription" && (
                          <Repeat className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.category} · {formatCurrency(asset.price)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(asset.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}