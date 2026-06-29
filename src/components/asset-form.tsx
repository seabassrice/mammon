"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { addAsset, updateAsset, getAssetById } from "@/lib/db";
import type {
  AssetType,
} from "@/lib/types";
import {
  ASSET_CATEGORIES,
  PHYSICAL_STATUS_OPTIONS,
  SUBSCRIPTION_CYCLE_OPTIONS,
  PLATFORM_OPTIONS,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Package, Gamepad2, Repeat, Plus } from "lucide-react";
import { getTodayStr } from "@/lib/utils";

// Zod schemas
const baseSchema = z.object({
  name: z.string().min(1, "请输入名称"),
  category: z.string().min(1, "请选择分类"),
  tags: z.string(), // comma-separated tags
  price: z.coerce.number().min(0, "价格必须大于等于0"),
  notes: z.string().optional(),
  image_urls: z.array(z.string()).optional(),
});

const physicalSchema = baseSchema.extend({
  purchaseDate: z.string().min(1, "请选择购买日期"),
  brand: z.string().optional(),
  purchaseChannel: z.string().optional(),
  storageLocation: z.string().optional(),
  warrantyExpire: z.string().optional(),
  status: z.enum(["in_use", "idle", "reselling", "discarded", "donated"]),
});

const digitalGameSchema = baseSchema.extend({
  addedDate: z.string().min(1, "请选择入库日期"),
  platform: z.enum(["Steam", "Epic", "PS", "Xbox", "Other"]),
  activated: z.boolean(),
  completed: z.boolean(),
});

const subscriptionSchema = baseSchema.extend({
  billingCycle: z.enum(["monthly", "yearly", "custom", "once"]),
  cycleDays: z.coerce.number().optional(),
  firstBillingDate: z.string().min(1, "请选择首次扣费日"),
  nextBillingDate: z.string().optional(),
  autoRenew: z.boolean(),
}).refine(
  (data) => {
    if (data.billingCycle !== "once" && !data.nextBillingDate) {
      return false;
    }
    return true;
  },
  { message: "请选择下次扣费日", path: ["nextBillingDate"] }
);

interface AssetFormProps {
  assetId?: string;
}

export function AssetForm({ assetId }: AssetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>("physical");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>("");
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      assetType === "physical"
        ? physicalSchema
        : assetType === "digital_game"
        ? digitalGameSchema
        : subscriptionSchema
    ),
    defaultValues: {
      name: "",
      category: "",
      tags: "",
      price: 0,
      notes: "",
      image_urls: [],
      status: "in_use",
      purchaseDate: getTodayStr(),
      addedDate: getTodayStr(),
      platform: "Steam",
      activated: false,
      completed: false,
      billingCycle: "monthly",
      cycleDays: undefined,
      firstBillingDate: getTodayStr(),
      nextBillingDate: getTodayStr(),
      autoRenew: true,
    },
  });

  // Load existing asset
  useEffect(() => {
    if (assetId) {
      (async () => {
        const asset = await getAssetById(assetId);
        if (asset) {
          setAssetType(asset.type);
          const urls = asset.image_urls || (asset.image ? [asset.image] : []);
          setImageUrls(urls);
          setValue("image_urls", urls as any);
          reset({
            ...asset,
            tags: asset.tags?.join(", ") || "",
          });
        }
      })();
    }
  }, [assetId, reset]);

  // When billing cycle changes to "once", hide next billing and auto-renew
  const billingCycle = watch("billingCycle");
  useEffect(() => {
    if (billingCycle === "once") {
      setValue("autoRenew", false as any);
      setValue("nextBillingDate", "" as any);
    }
  }, [billingCycle, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newUrls = [...imageUrls, base64];
        setImageUrls(newUrls);
        setValue("image_urls", newUrls as any);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    // Basic URL validation
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      alert("请输入有效的图片链接（以 http:// 或 https:// 开头）");
      return;
    }
    const newUrls = [...imageUrls, trimmed];
    setImageUrls(newUrls);
    setValue("image_urls", newUrls as any);
    setUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setValue("image_urls", newUrls as any);
    // Clear error for removed index
    const newErrors = new Set(imageLoadError);
    newErrors.delete(index);
    setImageLoadError(newErrors);
  };

  const onSubmit = async (formData: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Parse tags
      const tagsStr = formData.tags as string | undefined;
      const tags = tagsStr
        ? tagsStr
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t)
        : [];

      // Build the asset data, strip nextBillingDate/autoRenew for "once" cycle
      const assetData: Record<string, unknown> = {
        ...formData,
        type: assetType,
        tags,
        price: Number(formData.price),
      };

      // Clean up fields that shouldn't be saved for "once" subscriptions
      if (assetData.billingCycle === "once") {
        delete assetData.nextBillingDate;
        assetData.autoRenew = false;
      }

      if (assetId) {
        await updateAsset(assetId, assetData);
      } else {
        await addAsset(assetData);
      }

      router.push(assetId ? `/assets/${assetId}` : "/assets");
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const errs = errors as Record<string, any>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assetId ? "编辑资产" : "新增资产"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 资产类型选择 */}
          {!assetId && (
            <div className="space-y-2">
              <Label>资产类型</Label>
              <div className="flex gap-2">
                {(["physical", "digital_game", "subscription"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={assetType === type ? "default" : "outline"}
                      onClick={() => setAssetType(type)}
                    >
                      {type === "physical" ? (
                        <><Package className="mr-2 h-4 w-4" />实物</>
                      ) : type === "digital_game" ? (
                        <><Gamepad2 className="mr-2 h-4 w-4" />游戏/虚拟</>
                      ) : (
                        <><Repeat className="mr-2 h-4 w-4" />订阅</>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}

          {/* 基本信息 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input id="name" {...register("name")} placeholder="资产名称" />
              {errs.name&& (
                <p className="text-sm text-destructive">
                  {errs.name.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类 *</Label>
              <Select
                value={watch("category")}
                onValueChange={(val: string) => setValue("category", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES[assetType].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errs.category&& (
                <p className="text-sm text-destructive">
                  {errs.category.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">价格 (¥) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price")}
              />
              {errs.price&& (
                <p className="text-sm text-destructive">
                  {errs.price.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签（逗号分隔）</Label>
              <Input
                id="tags"
                {...register("tags")}
                placeholder="例如: 重要, 常用, 收藏"
              />
            </div>
          </div>

          {/* 图片上传 */}
          <div className="space-y-2">
            <Label>图片</Label>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList>
                <TabsTrigger value="upload">本地上传</TabsTrigger>
                <TabsTrigger value="url">图片链接</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-xs"
                />
              </TabsContent>
              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="粘贴图片链接..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddUrl}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Image previews grid */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 group">
                    {imageLoadError.has(index) ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded text-xs text-muted-foreground p-1 text-center">
                        无法加载该图片，请检查链接
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`图片 ${index + 1}`}
                        className="w-full h-full object-cover rounded border"
                        onError={() => setImageLoadError((prev) => new Set(prev).add(index))}
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 实物资产特定字段 */}
          {assetType === "physical" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">购买日期 *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...register("purchaseDate")}
                />
                {errs.purchaseDate && (
                  <p className="text-sm text-destructive">
                    {errs.purchaseDate.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">状态 *</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(val: string) => setValue("status", val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
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

              <div className="space-y-2">
                <Label htmlFor="brand">品牌</Label>
                <Input
                  id="brand"
                  {...register("brand")}
                  placeholder="例如: Apple, Sony"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseChannel">购买渠道</Label>
                <Input
                  id="purchaseChannel"
                  {...register("purchaseChannel")}
                  placeholder="例如: 京东, 淘宝, 实体店"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageLocation">存放位置</Label>
                <Input
                  id="storageLocation"
                  {...register("storageLocation")}
                  placeholder="例如: 书房, 客厅"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpire">保修截止日</Label>
                <Input
                  id="warrantyExpire"
                  type="date"
                  {...register("warrantyExpire")}
                />
              </div>
            </div>
          )}

          {/* 游戏资产特定字段 */}
          {assetType === "digital_game" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addedDate">入库日期 *</Label>
                <Input
                  id="addedDate"
                  type="date"
                  {...register("addedDate")}
                />
                {errs.addedDate && (
                  <p className="text-sm text-destructive">
                    {errs.addedDate.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">平台 *</Label>
                <Select
                  value={watch("platform")}
                  onValueChange={(val: string) => setValue("platform", val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("activated")}
                    className="h-4 w-4"
                  />
                  <span>已激活</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("completed")}
                    className="h-4 w-4"
                  />
                  <span>已通关</span>
                </label>
              </div>
            </div>
          )}

          {/* 订阅资产特定字段 */}
          {assetType === "subscription" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">扣费周期 *</Label>
                <Select
                  value={watch("billingCycle")}
                  onValueChange={(val: string) => setValue("billingCycle", val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择周期" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_CYCLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {watch("billingCycle") === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="cycleDays">自定义周期（天）</Label>
                  <Input
                    id="cycleDays"
                    type="number"
                    min="1"
                    {...register("cycleDays")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="firstBillingDate">首次扣费日 *</Label>
                <Input
                  id="firstBillingDate"
                  type="date"
                  {...register("firstBillingDate")}
                />
                {errs.firstBillingDate && (
                  <p className="text-sm text-destructive">
                    {errs.firstBillingDate.message as string}
                  </p>
                )}
              </div>

              {billingCycle !== "once" && (
                <div className="space-y-2">
                  <Label htmlFor="nextBillingDate">下次扣费日 *</Label>
                  <Input
                    id="nextBillingDate"
                    type="date"
                    {...register("nextBillingDate")}
                  />
                  {errs.nextBillingDate && (
                    <p className="text-sm text-destructive">
                      {errs.nextBillingDate.message as string}
                    </p>
                  )}
                </div>
              )}

              {billingCycle !== "once" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("autoRenew")}
                    className="h-4 w-4"
                  />
                  <Label>自动续费</Label>
                </div>
              )}
            </div>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="添加备注信息..."
              rows={3}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : assetId ? "更新" : "创建"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}