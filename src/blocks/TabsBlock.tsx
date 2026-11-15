/**
 * 标签页（re0BNA，antd 版）。
 *
 * 与 EP 的 BlockTabs 同一套语义：
 * - items 兼容旧成对字符串与结构化 TabItem[]；
 * - active 支持按自定义 mark 匹配（数据控制默认激活）；
 * - 页签内容 dataPath → 绑定数据的 schema、url → 外部 schema JSON，
 *   两者都按 schema 协议用 SchemaFragment 递归渲染，共用宿主 scope；
 * - 设计态只读预览：不请求接口、不挂事件。
 */
import { useContext, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Tabs } from "antd";
import {
  getByPath,
  parseTabItems,
  request,
  type NodeSchema,
  type PageSchema,
  type TabItem,
} from "@x-ac/web-design-core";
import { RenderContext, SchemaFragment } from "@x-ac/web-design-react";

interface TabsBlockProps {
  style?: CSSProperties;
  items?: unknown;
  active?: unknown;
  type?: unknown;
  tabPosition?: unknown;
}

interface RemoteState {
  loading: boolean;
  error: string;
  data?: PageSchema | NodeSchema[];
}

const STATE_STYLE: CSSProperties = { padding: "8px 0", fontSize: 12, color: "#8b93a5" };
const BODY_STYLE: CSSProperties = { fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "4px 0" };

/** 单个页签内容：按 dataPath → url → text 依次解析 */
function TabPanel({ tab }: { tab: TabItem }) {
  const ctx = useContext(RenderContext);
  const scope = ctx?.scope ?? {};
  const design = ctx?.design ?? false;
  const mode = design ? "edit" : (ctx?.mode ?? "view");
  const [remote, setRemote] = useState<RemoteState>({ loading: false, error: "" });

  useEffect(() => {
    if (!tab.url || design) return;
    let alive = true;
    setRemote({ loading: true, error: "" });
    const pending = tab.method === "post" ? request.post(tab.url) : request.get(tab.url);
    pending
      .then((res) => {
        if (alive) setRemote({ loading: false, error: "", data: res.data as PageSchema | NodeSchema[] });
      })
      .catch((error: unknown) => {
        if (alive) {
          setRemote({
            loading: false,
            error: `内容加载失败：${(error as Error)?.message ?? String(error)}`,
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [tab.url, tab.method, design]);

  if (tab.dataPath) {
    const value = getByPath(scope, tab.dataPath) as PageSchema | NodeSchema[] | null;
    if (value) return <SchemaFragment page={value} mode={mode} design={false} />;
  }
  if (tab.url) {
    if (remote.loading) return <div style={STATE_STYLE}>加载中…</div>;
    if (remote.error) return <div style={{ ...STATE_STYLE, color: "#e24b4a" }}>{remote.error}</div>;
    if (remote.data) return <SchemaFragment page={remote.data} mode={mode} design={false} />;
  }
  return <div style={BODY_STYLE}>{tab.text}</div>;
}

/** 解析默认激活键：先 label，再 mark；没有配置或匹配不到时回到第一项 */
function resolveKey(tabs: TabItem[], active: unknown): string {
  if (!tabs.length) return "";
  const raw = String(active ?? "").trim();
  if (!raw) return "0";
  const at = tabs.findIndex(
    (tab) => tab.label === raw || (tab.mark !== undefined && tab.mark === raw),
  );
  // 配置的默认项找不到（如标题被改过）时回到第一项，避免整页没有激活页签
  return at >= 0 ? String(at) : "0";
}

export function TabsBlock({ style, items, active, type, tabPosition }: TabsBlockProps) {
  const tabs = useMemo(() => parseTabItems(items), [items]);
  // 首帧就要有正确的 activeKey：antd 在 activeKey 为空时不渲染任何 pane，
  // 若只用 effect 异步补齐，首屏会空一帧（测试里表现为内嵌内容始终不出现）
  const [current, setCurrent] = useState(() => resolveKey(tabs, active));

  useEffect(() => {
    setCurrent(resolveKey(tabs, active));
  }, [tabs, active]);

  const tabItems = tabs.map((tab, index) => ({
    key: String(index),
    label: tab.label,
    children: <TabPanel tab={tab} />,
  }));

  const kind = type === "card" || type === "border-card" ? "card" : "line";
  // antd 6 用 start / end 表示左右，Schema 沿用通用的 left / right，这里做一次映射
  const PLACEMENT = { top: "top", bottom: "bottom", left: "start", right: "end" } as const;
  const position = PLACEMENT[String(tabPosition) as keyof typeof PLACEMENT] ?? "top";

  return (
    <Tabs
      style={style}
      type={kind}
      tabPlacement={position}
      activeKey={current}
      onChange={setCurrent}
      items={tabItems}
    />
  );
}
