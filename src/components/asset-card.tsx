"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Package, Gamepad2, Repeat, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteAsset } from "@/lib/data-service";
import type { Asset } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getTypeLabel,
  getStatusLabel,
  getPlatformLabel,
  getCycleLabel,
} from "@/lib/utils";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`确定要删除"${asset.name}"吗？`)) {
      await deleteAsset(asset.id);
      router.refresh();
    }
  };

  return (
    <Link href={`/assets/${asset.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 z-10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        <CardContent className="p-4">
          {/* 类型标签 */}
          <div className="flex items-center gap-2 mb-2">
            {asset.type === "physical" && (
              <Package className="h-4 w-4 text-zinc-500" />
            )}
            {asset.type === "digital_game" && (
              <Gamepad2 className="h-4 w-4 text-purple-500" />
            )}
            {asset.type === "subscription" && (
              <Repeat className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {getTypeLabel(asset.type)}
            </span>
          </div>

          {/* 图片预览 */}
          {(asset.image_urls && asset.image_urls.length > 0) || asset.image ? (
            <div className="mb-3">
              <img
                src={asset.image_urls?.[0] || asset.image || ""}
                alt={asset.name}
                className="w-full h-32 object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : null}

          {/* 资产名称 */}
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {asset.name}
          </h3>

          {/* 价格 */}
          <p className="text-2xl font-bold text-primary mb-3">
            {formatCurrency(asset.price)}
          </p>

          {/* 分类和标签 */}
          <div className="space-y-2 mb-3">
            <p className="text-sm text-muted-foreground">
              <Package className="inline h-3 w-3 mr-1" />
              {asset.category}
            </p>
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {asset.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {asset.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{asset.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 类型特定信息 */}
          {asset.type === "physical" && (
            <div className="space-y-1 text-sm">
              {"brand" in asset && asset.brand && (
                <p className="text-muted-foreground">品牌: {asset.brand}</p>
              )}
              {"status" in asset && (
                <p className="text-muted-foreground">
                  状态: {getStatusLabel(asset.status)}
                </p>
              )}
              {"purchaseDate" in asset && (
                <p className="text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatDate(asset.purchaseDate)}
                </p>
              )}
            </div>
          )}

          {asset.type === "digital_game" && (
            <div className="space-y-1 text-sm">
              {"platform" in asset && (
                <p className="text-muted-foreground">
                  平台: {getPlatformLabel(asset.platform)}
                </p>
              )}
              {"activated" in asset && (
                <p className="text-muted-foreground flex items-center gap-1">
                  {asset.activated ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      已激活
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                      未激活
                    </>
                  )}
                </p>
              )}
              {"completed" in asset && asset.completed && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  已通关
                </p>
              )}
            </div>
          )}

          {asset.type === "subscription" && (
            <div className="space-y-1 text-sm">
              {"billingCycle" in asset && (
                <p className="text-muted-foreground">
                  周期: {getCycleLabel(asset.billingCycle)}
                </p>
              )}
              {asset.billingCycle !== "once" && "nextBillingDate" in asset && (
                <p className="text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  下次扣费: {formatDate(asset.nextBillingDate)}
                </p>
              )}
              {asset.billingCycle !== "once" && "autoRenew" in asset && (
                <p className="text-muted-foreground">
                  {asset.autoRenew ? "自动续费" : "手动续费"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}