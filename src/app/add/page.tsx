"use client";

import { AssetForm } from "@/components/asset-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddAssetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新增资产</h1>
          <p className="text-muted-foreground mt-1">
            记录你的新资产信息
          </p>
        </div>
      </div>

      <AssetForm />
    </div>
  );
}