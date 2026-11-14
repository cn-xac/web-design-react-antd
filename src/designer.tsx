/**
 * 设计器自身 UI 的 Ant Design 实现（designer kit）。
 *
 * 引擎的 UiControl 按槽位解析控件，契约是 DesignerControlProps：
 *   value + onChange(value) / options / type / size / disabled / placeholder /
 *   rows / min / max / step / controls / showAlpha / className / onClick / children。
 * 这里把这套归一化语义翻成 antd 的 props，让**属性设置面板、物料面板、顶栏**
 * 用的都是同一个 UI 库的组件 —— 设计时与运行时不再两张皮。
 *
 * 与 Vue 的 Element Plus 适配层完全对称，差别只在 React 的受控通道是 value/onChange。
 */
import type { ReactElement, ReactNode } from "react";
import {
  Button,
  ColorPicker,
  Input,
  InputNumber,
  Segmented,
  Select,
  Switch,
  Tooltip,
} from "antd";
import type { DesignerControlProps } from "@x-ac/web-design-react/designer";
import { antdActionAdapter } from "./actions";

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SlotProps extends DesignerControlProps {
  children?: ReactNode;
  /** Tooltip 槽位的文案（引擎只传这一个字段，见 core 的 DesignerTooltipProps） */
  text?: string;
  /**
   * 下拉可搜索：引擎把该开关透传给设计器 Select（元素多时用）。
   * 引擎的 DesignerControlProps 从 1.1.0 起带此字段，这里仍显式声明一次，
   * 老版本引擎（1.0.x）下也能编译，不会被判成多余属性。
   */
  filterable?: boolean;
}

const normalizeOptions = (options: SlotProps["options"] = []): SelectOption[] =>
  options.map((item) =>
    typeof item === "object" && item !== null && "label" in item
      ? (item as SelectOption)
      : { label: String(item), value: item as string | number },
  );

/** 归一化 type：引擎给 default/primary/danger/text，antd 用 type + danger 两个属性表达 */
function buttonProps(type: SlotProps["type"]): { type: "default" | "primary" | "link" | "text" | "dashed"; danger?: boolean } {
  const t = String(type ?? "default");
  if (t === "primary") return { type: "primary" };
  if (t === "danger") return { type: "primary", danger: true };
  if (t === "text") return { type: "text" };
  return { type: "default" };
}

function AntdButton({ type, size, disabled, className, onClick, children }: SlotProps) {
  const { type: antdType, danger } = buttonProps(type);
  return (
    <Button
      type={antdType}
      danger={danger}
      size={size === "small" ? "small" : "middle"}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function AntdInput({ value, onChange, rows, placeholder, disabled, className }: SlotProps) {
  const common = {
    value: value === undefined || value === null ? "" : String(value),
    placeholder,
    disabled,
    className,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(event.target.value),
  };
  return rows && rows > 1 ? <Input.TextArea {...common} rows={rows} /> : <Input {...common} />;
}

function AntdNumber({ value, onChange, min, max, step, disabled, controls, className }: SlotProps) {
  return (
    <InputNumber
      value={value === undefined || value === null || value === "" ? null : Number(value)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      controls={controls !== false}
      className={className}
      onChange={(next) => onChange?.(next ?? "")}
    />
  );
}

function AntdSelect({ value, onChange, options, placeholder, disabled, clearable, filterable, className }: SlotProps) {
  return (
    <Select
      value={value === undefined || value === null ? undefined : (value as string | number)}
      options={normalizeOptions(options)}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={Boolean(clearable)}
      // 可搜索：antd 用 showSearch + optionFilterProp 表达（默认按 label 过滤）
      showSearch={Boolean(filterable)}
      optionFilterProp={filterable ? "label" : undefined}
      className={className}
      onChange={(next) => onChange?.(next ?? "")}
    />
  );
}

function AntdSwitch({ value, onChange, disabled, className }: SlotProps) {
  return (
    <Switch
      checked={Boolean(value)}
      disabled={disabled}
      className={className}
      onChange={(next) => onChange?.(next)}
    />
  );
}

function AntdSegmented({ value, onChange, options, className }: SlotProps) {
  return (
    <Segmented
      value={value as string | number}
      options={normalizeOptions(options)}
      className={className}
      onChange={(next) => onChange?.(next)}
    />
  );
}

function AntdColor({ value, onChange, disabled, showAlpha, className }: SlotProps) {
  return (
    <ColorPicker
      value={value === undefined || value === null ? undefined : String(value)}
      disabled={disabled}
      disabledAlpha={!showAlpha}
      className={className}
      showText
      onChange={(_color, css) => onChange?.(css)}
    />
  );
}

/**
 * 说明提示槽位：引擎的 HelpTip 只认 `text`（文案）+ 默认插槽（问号按钮），
 * antd 的 Tooltip 用 `title` 表达内容，差异在这里抹平。
 * 注册后设计器里的问号浮层就是 antd 的浮层，与属性面板同观感。
 */
function AntdTooltip({ text, children }: SlotProps) {
  return (
    <Tooltip title={text} placement="top" mouseEnterDelay={0.15}>
      {children as ReactElement}
    </Tooltip>
  );
}

/**
 * 完整 designer kit：7 个控件槽位 + 说明提示 + 命令式提示，不依赖引擎的原生回落。
 * notify 复用运行时的动作适配器，设计器内的提示与页面运行时同一条通道
 * （宿主注入了 AntdAppBridge 就走 App context 的 message，否则回落静态 message）。
 */
export const antdDesignerKit = {
  Button: AntdButton,
  Input: AntdInput,
  NumberInput: AntdNumber,
  Select: AntdSelect,
  Switch: AntdSwitch,
  Segmented: AntdSegmented,
  ColorInput: AntdColor,
  Tooltip: AntdTooltip,
  // 包一层而不是直接给引用：引擎的 notify 第二个参数可省略，动作适配器要求必填
  notify: (message: string, type: "success" | "warning" | "error" | "info" = "info") =>
    antdActionAdapter.notify(message, type),
};
