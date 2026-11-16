/**
 * 标签项维护弹窗（re0BNA，antd 版）。
 *
 * 增删改 + 标题拖拽排序；内容来源三选一（文本 / 绑定数据 / 外部 URL）。
 * 新建项才生成 id，已有项沿用原 id 保证拖拽后 key 稳定。
 */
import { useState } from "react";
import type { CSSProperties } from "react";
import { Button, Input, Modal, Select } from "antd";
import { createTabId, type TabItem } from "@x-ac/web-design-core";

type ContentKind = "design" | "dataPath" | "url";

export interface TabItemsDialogProps {
  items: TabItem[];
  onSave: (items: TabItem[]) => void;
  onClose: () => void;
}

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px 1.1fr 0.9fr 104px 1.6fr 56px",
  alignItems: "center",
  gap: 8,
};

function contentKind(row: TabItem): ContentKind {
  if (row.content === "dataPath" || row.content === "url") return row.content;
  if (row.dataPath) return "dataPath";
  if (row.url) return "url";
  return "design";
}

export function TabItemsDialog({ items, onSave, onClose }: TabItemsDialogProps) {
  const [rows, setRows] = useState<TabItem[]>(
    items.length
      ? items.map((item) => ({ ...item, content: item.content ?? "design" }))
      : [{ id: createTabId(), label: "标签一", content: "design" }],
  );
  const [dragIndex, setDragIndex] = useState(-1);
  const [overIndex, setOverIndex] = useState(-1);

  const patch = (index: number, next: Partial<TabItem>) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...next } : row)));

  /** 切换内容来源时清掉另外两种，避免残留配置在运行时抢优先级 */
  const setKind = (index: number, kind: ContentKind) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const rest: TabItem = { ...row, content: kind };
        if (kind === "design") {
          delete rest.dataPath;
          delete rest.url;
          delete rest.method;
          delete rest.text;
          return rest;
        }
        if (kind === "dataPath") {
          delete rest.url;
          delete rest.method;
          delete rest.text;
          rest.dataPath = row.dataPath ?? "";
          return rest;
        }
        delete rest.dataPath;
        delete rest.text;
        rest.url = row.url ?? "";
        rest.method = row.method ?? "get";
        return rest;
      }),
    );
  };

  const onDrop = (index: number) => {
    if (dragIndex < 0 || dragIndex === index) return;
    setRows((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(-1);
    setOverIndex(-1);
  };

  const save = () => {
    const out: TabItem[] = rows
      .map((row) => {
        const item: TabItem = { id: row.id, label: row.label.trim() };
        if (row.mark?.trim()) item.mark = row.mark.trim();
        const kind = contentKind(row);
        item.content = kind;
        if (kind === "dataPath") {
          if (row.dataPath?.trim()) item.dataPath = row.dataPath.trim();
        } else if (kind === "url" && row.url?.trim()) {
          item.url = row.url.trim();
          item.method = row.method ?? "get";
        }
        return item;
      })
      .filter((row) => row.label !== "");
    onSave(out);
    onClose();
  };

  return (
    <Modal open title="标签项维护" width={820} onCancel={onClose} footer={null} destroyOnHidden>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row, index) => (
          <div
            key={row.id}
            style={{
              ...GRID,
              padding: 6,
              border: "1px solid #e8e8e8",
              borderRadius: 6,
              opacity: dragIndex === index ? 0.5 : 1,
              borderColor: overIndex === index && dragIndex !== index ? "#1677ff" : "#e8e8e8",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={() => onDrop(index)}
          >
            <span
              title="拖拽排序"
              draggable
              onDragStart={(e) => {
                setDragIndex(index);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDragIndex(-1);
                setOverIndex(-1);
              }}
              style={{ textAlign: "center", cursor: "grab", color: "#bfbfbf", fontSize: 16, userSelect: "none" }}
            >
              ⠿
            </span>

            <Input size="small" placeholder="标签标题" value={row.label} onChange={(e) => patch(index, { label: e.target.value })} />
            <Input size="small" placeholder="标记（可选）" value={row.mark ?? ""} onChange={(e) => patch(index, { mark: e.target.value })} />

            <Select
              size="small"
              value={contentKind(row)}
              onChange={(v) => setKind(index, v as ContentKind)}
              options={[
                { label: "设计器内编辑", value: "design" },
                { label: "绑定数据", value: "dataPath" },
                { label: "外部 URL", value: "url" },
              ]}
            />

            {contentKind(row) === "design" && (
              <span style={{ fontSize: 11, color: "#8b93a5", paddingLeft: 2 }}>在画布里向该页签拖入组件</span>
            )}
            {contentKind(row) === "dataPath" && (
              <Input size="small" placeholder="如 form.detailSchema" value={row.dataPath ?? ""} onChange={(e) => patch(index, { dataPath: e.target.value })} />
            )}
            {contentKind(row) === "url" && (
              <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 6 }}>
                <Select
                  size="small"
                  value={row.method ?? "get"}
                  onChange={(v) => patch(index, { method: v === "post" ? "post" : "get" })}
                  options={[
                    { label: "GET", value: "get" },
                    { label: "POST", value: "post" },
                  ]}
                />
                <Input size="small" placeholder="返回 schema JSON 的地址" value={row.url ?? ""} onChange={(e) => patch(index, { url: e.target.value })} />
              </div>
            )}

            <Button
              size="small"
              type="text"
              danger
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            >
              删除
            </Button>
          </div>
        ))}

        <Button
          size="small"
          type="link"
          onClick={() => setRows((prev) => [...prev, { id: createTabId(), label: `标签${prev.length + 1}`, content: "design" }])}
        >
          + 新增标签项
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <Button size="small" onClick={onClose}>取消</Button>
        <Button size="small" type="primary" onClick={save}>保存</Button>
      </div>
    </Modal>
  );
}
