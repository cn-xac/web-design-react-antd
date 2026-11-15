/**
 * 标签项字段编辑器（re0BNA，antd 版）。
 *
 * 契约与引擎 PropsEditor 对齐：接受 value / field，通过 onChange 回写。
 * 面板只显示摘要，点开弹窗集中维护（增删改 + 拖拽排序）。
 */
import { useState } from "react";
import type { CSSProperties } from "react";
import { parseTabItems, type PropField, type TabItem } from "@x-ac/web-design-core";
import { TabItemsDialog } from "./TabItemsDialog";

export interface TabItemsEditorProps {
  value?: unknown;
  field?: PropField;
  onChange?: (value: TabItem[]) => void;
}

const BTN_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "5px 8px",
  border: "1px solid #d9d9d9",
  borderRadius: 5,
  background: "#fff",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

export function TabItemsEditor({ value, onChange }: TabItemsEditorProps) {
  const [open, setOpen] = useState(false);
  const items = parseTabItems(value);

  const names = items.map((item) => item.label).filter(Boolean);
  const summary = names.length
    ? names.length > 3
      ? `${names.slice(0, 3).join("、")} 等 ${names.length} 项`
      : `${names.join("、")}（${names.length} 项）`
    : "尚未设置";

  return (
    <>
      <button type="button" style={BTN_STYLE} onClick={() => setOpen(true)}>
        <span style={{ flex: 1, fontSize: 12, color: "#595959", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {summary}
        </span>
        <span style={{ fontSize: 11, color: "#1677ff", whiteSpace: "nowrap" }}>编辑…</span>
      </button>
      {open && (
        <TabItemsDialog
          items={items}
          onSave={(next) => {
            onChange?.(next);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
