/**
 * 容器数据驱动编辑器（rGjzDs，antd 版）。
 * 契约与引擎 PropsEditor 对齐：接受 value / field，通过 onChange 回写路径字符串。
 */
import type { CSSProperties } from "react";
import type { PropField } from "@x-ac/web-design-core";

export interface JsonPageEditorProps {
  value?: unknown;
  field?: PropField;
  onChange?: (value: string) => void;
}

const INPUT_STYLE: CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  border: "1px solid #d9d9d9",
  borderRadius: 5,
  fontFamily: "inherit",
  fontSize: 12,
  boxSizing: "border-box",
};
const TIP_STYLE: CSSProperties = { marginTop: 4, fontSize: 11, lineHeight: 1.5, color: "#8b93a5" };

export function JsonPageEditor({ value, onChange }: JsonPageEditorProps) {
  const text = typeof value === "string" ? value : "";
  return (
    <div>
      <input
        style={INPUT_STYLE}
        type="text"
        value={text}
        placeholder="scope 路径，如 form.detail"
        onChange={(event) => onChange?.(event.target.value)}
      />
      <div style={TIP_STYLE}>留空则使用拖入的静态节点；填写后运行时把该处 JSON 推导成页面</div>
    </div>
  );
}
