"use client";

import { useState, useRef } from "react";
import { exportAllData, importData, clearAllAssets } from "@/lib/data-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mammon-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`成功导出 ${data.length} 项资产`);
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format");
      }

      const count = await importData(data);
      alert(`成功导入 ${count} 项资产`);
      window.location.reload();
    } catch (error) {
      console.error("导入失败:", error);
      alert("导入失败，文件格式不正确");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAllAssets();
      alert("已清空所有数据");
      window.location.reload();
    } catch (error) {
      console.error("清空失败:", error);
      alert("清空失败，请重试");
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground mt-1">管理你的数据</p>
      </div>

      {/* 导出数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出数据
          </CardTitle>
          <CardDescription>
            将所有资产数据导出为JSON文件，用于备份或迁移
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "导出中..." : "导出所有数据"}
          </Button>
        </CardContent>
      </Card>

      {/* 导入数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            导入数据
          </CardTitle>
          <CardDescription>
            从JSON文件导入资产数据，会合并到现有数据中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "导入中..." : "选择JSON文件"}
          </Button>
          <p className="text-sm text-muted-foreground">
            支持导入Mammon导出的JSON备份文件
          </p>
        </CardContent>
      </Card>

      {/* 清空数据 */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            清空数据
          </CardTitle>
          <CardDescription>
            删除所有资产数据，此操作不可撤销
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            disabled={clearing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清空所有数据
          </Button>
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清空数据</DialogTitle>
            <DialogDescription>
              此操作将永久删除所有资产数据，且无法恢复。建议先导出备份。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing ? "清空中..." : "确认清空"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关于信息 */}
      <Card>
        <CardHeader>
          <CardTitle>关于 Mammon</CardTitle>
          <CardDescription>个人资产记录应用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>版本: {process.env.NEXT_PUBLIC_APP_VERSION || "2.0"}</p>
          <div>
            <p className="font-medium text-foreground mb-1">数据存储</p>
            <ul className="list-disc list-inside space-y-1">
              <li>登录后：数据存储在 Vercel Postgres（Neon）云端数据库中，按用户隔离</li>
              <li>未登录：数据暂存在浏览器本地 IndexedDB 中</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}