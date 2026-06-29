"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllAssets } from "@/lib/db";
import type { Asset } from "@/lib/types";
import { AssetCard } from "@/components/asset-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_CATEGORIES } from "@/lib/types";
import { Plus, Search, X } from "lucide-react";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

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

  // 获取所有唯一的标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach((a) => a.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [assets]);

  // 过滤资产
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          asset.name.toLowerCase().includes(query) ||
          asset.category.toLowerCase().includes(query) ||
          asset.tags?.some((t) => t.toLowerCase().includes(query)) ||
          ("brand" in asset && asset.brand?.toLowerCase().includes(query)) ||
          ("platform" in asset && asset.platform.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // 分类过滤
      if (selectedCategory !== "all" && asset.category !== selectedCategory) {
        return false;
      }

      // 标签过滤
      if (selectedTag !== "all" && !asset.tags?.includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, selectedCategory, selectedTag]);

  // 按类型分组
  const physicalAssets = filteredAssets.filter((a) => a.type === "physical");
  const gameAssets = filteredAssets.filter((a) => a.type === "digital_game");
  const subscriptionAssets = filteredAssets.filter(
    (a) => a.type === "subscription"
  );

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

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">资产列表</h1>
          <p className="text-muted-foreground mt-1">
            共 {filteredAssets.length} 项资产
          </p>
        </div>
        <Link href="/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增
          </Button>
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索名称、分类、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2">
          {/* 分类筛选 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {Object.entries(ASSET_CATEGORIES).flatMap(([, cats]) =>
                cats.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* 标签筛选 */}
          {allTags.length > 0 && (
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="全部标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 清除筛选 */}
          {(selectedCategory !== "all" || selectedTag !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedTag("all");
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* Tab切换 */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">全部 ({filteredAssets.length})</TabsTrigger>
          <TabsTrigger value="physical">实物 ({physicalAssets.length})</TabsTrigger>
          <TabsTrigger value="game">游戏 ({gameAssets.length})</TabsTrigger>
          <TabsTrigger value="subscription">
            订阅 ({subscriptionAssets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">没有找到匹配的资产</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="physical" className="space-y-4">
          {physicalAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">没有实物资产</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {physicalAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="game" className="space-y-4">
          {gameAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">没有游戏资产</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gameAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          {subscriptionAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">没有订阅资产</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptionAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}