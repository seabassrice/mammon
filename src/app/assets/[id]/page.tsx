"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAssetById,
  deleteAsset,
  updateAsset,
} from "@/lib/data-service";
import type {
  Asset,
  PhysicalAsset,
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getTypeLabel,
  getPlatformLabel,
  getCycleLabel,
} from "@/lib/utils";
import { PHYSICAL_STATUS_OPTIONS } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getAssetById(assetId);
      if (data) {
        setAsset(data);
      }
      setLoading(false);
    })();
  }, [assetId]);

  const handleDelete = async () => {
    if (!asset) return;
    if (confirm(`确定要删除"${asset.name}"吗？此操作不可撤销。`)) {
      await deleteAsset(assetId);
      router.push("/assets");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!asset || asset.type !== "physical") return;
    setUpdating(true);
    const updated = await updateAsset(assetId, { status: newStatus });
    if (updated) {
      setAsset(updated as PhysicalAsset);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">资产未找到</h1>
        </div>
        <p className="text-muted-foreground">该资产不存在或已被删除。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <p className="text-muted-foreground mt-1">资产详情</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/edit/${assetId}`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 主卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              基本信息
            </CardTitle>
            <Badge>{getTypeLabel(asset.type)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 图片 */}
          {(asset.image_urls && asset.image_urls.length > 0) || asset.image ? (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(asset.image_urls || (asset.image ? [asset.image] : [])).map(
                  (imgUrl: string, index: number) => (
                    <img
                      key={index}
                      src={imgUrl}
                      alt={`${asset.name} 图片 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )
                )}
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">名称</p>
              <p className="font-medium">{asset.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">价格</p>
              <p className="font-medium text-2xl text-primary">
                {formatCurrency(asset.price)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">分类</p>
              <p className="font-medium">{asset.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">标签</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {asset.tags && asset.tags.length > 0 ? (
                  asset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">无</span>
                )}
              </div>
            </div>
          </div>

          {asset.notes && (
            <div>
              <p className="text-sm text-muted-foreground">备注</p>
              <p className="font-medium whitespace-pre-wrap">{asset.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 类型特定信息 */}
      {asset.type === "physical" && (
        <Card>
          <CardHeader>
            <CardTitle>实物信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">状态</p>
                <div className="mt-1">
                  <Select
                    value={asset.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHYSICAL_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">购买日期</p>
                <p className="font-medium">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formatDate(asset.purchaseDate)}
                </p>
              </div>
              {asset.brand && (
                <div>
                  <p className="text-sm text-muted-foreground">品牌</p>
                  <p className="font-medium">{asset.brand}</p>
                </div>
              )}
              {asset.purchaseChannel && (
                <div>
                  <p className="text-sm text-muted-foreground">购买渠道</p>
                  <p className="font-medium">{asset.purchaseChannel}</p>
                </div>
              )}
              {asset.storageLocation && (
                <div>
                  <p className="text-sm text-muted-foreground">存放位置</p>
                  <p className="font-medium">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {asset.storageLocation}
                  </p>
                </div>
              )}
              {asset.warrantyExpire && (
                <div>
                  <p className="text-sm text-muted-foreground">保修截止日</p>
                  <p className="font-medium">
                    {formatDate(asset.warrantyExpire)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {asset.type === "digital_game" && (
        <Card>
          <CardHeader>
            <CardTitle>游戏信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">平台</p>
                <p className="font-medium">
                  {getPlatformLabel(asset.platform)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">入库日期</p>
                <p className="font-medium">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formatDate(asset.addedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">激活状态</p>
                <p className="font-medium flex items-center gap-1">
                  {asset.activated ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      已激活
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      未激活
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">通关状态</p>
                <p className="font-medium flex items-center gap-1">
                  {asset.completed ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      已通关
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      未通关
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {asset.type === "subscription" && (
        <Card>
          <CardHeader>
            <CardTitle>订阅信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">扣费周期</p>
                <p className="font-medium">{getCycleLabel(asset.billingCycle)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">首次扣费日</p>
                <p className="font-medium">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formatDate(asset.firstBillingDate)}
                </p>
              </div>
              {asset.billingCycle !== "once" && (
                <div>
                  <p className="text-sm text-muted-foreground">下次扣费日</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="inline h-4 w-4" />
                    {formatDate(asset.nextBillingDate)}
                    {(() => {
                      if (!asset.nextBillingDate) return null;
                      const billingDate = new Date(asset.nextBillingDate);
                      if (isNaN(billingDate.getTime())) return null;
                      const daysUntil = Math.ceil(
                        (billingDate.getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24)
                      );
                      if (daysUntil < 0) {
                        return (
                          <Badge variant="destructive" className="ml-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            已过期
                          </Badge>
                        );
                      } else if (daysUntil <= 7) {
                        return (
                          <Badge variant="secondary" className="ml-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {daysUntil}天后到期
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </p>
                </div>
              )}
              {asset.billingCycle !== "once" && (
                <div>
                  <p className="text-sm text-muted-foreground">自动续费</p>
                  <p className="font-medium flex items-center gap-1">
                    {asset.autoRenew ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        开启
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        关闭
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 创建和更新时间 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              创建时间: {formatDate(asset.createdAt)}
            </div>
            <div>
              更新时间: {formatDate(asset.updatedAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}