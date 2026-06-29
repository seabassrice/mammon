"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAssetById } from "@/lib/db";

export default function EditAssetPage() {
  const params = useParams();
  const assetId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    (async () => {
      const asset = await getAssetById(assetId);
      setExists(!!asset);
      setLoading(false);
    })();
  }, [assetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exists) {
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
      <div className="flex items-center gap-4">
        <Link href={`/assets/${assetId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑资产</h1>
          <p className="text-muted-foreground mt-1">修改资产信息</p>
        </div>
      </div>

      <AssetForm assetId={assetId} />
    </div>
  );
}