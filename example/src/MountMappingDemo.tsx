/**
 * 映射测试 · 容器挂载：一个完整页面里，一部分节点固定，另一部分由编辑的 JSON 实时解析后
 * 挂载到「选中的容器」下，并演示用 {{}} 指定字段的绑定位置（数据来自表单 scope）。
 *
 * 与「构建与渲染」的区别：这里不是两块独立渲染，而是把 JSON 节点**注入同一棵页面树**的指定容器，
 * 固定节点与动态节点一起渲染，直观看到「远程片段挂载到页面某容器」的效果。
 *
 * 不改引擎：挂载是示例层的纯函数（深拷贝宿主 + 递归找容器 + 写入 children），
 * 渲染仍走 SchemaRenderer，{{}} 绑定走 core 既有表达式引擎。
 */
import { useEffect, useMemo, useState } from "react";
import { Input, Select, Tag, Typography } from "antd";
import type { NodeSchema, PageSchema } from "@x-ac/web-design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";

/** 宿主页面：固定节点 + 三个可作挂载目标的容器（id 稳定，供下拉选择） */
const HOST: PageSchema = {
  schemaVersion: "1.3.0",
  id: "page_mount_mapping",
  type: "page",
  meta: { title: "容器挂载映射" },
  state: {},
  children: [
    { id: "mm_title", component: "ec-title", props: { text: "容器挂载映射 · 固定 + 动态混排", level: 3 } },
    {
      id: "mm_intro",
      component: "ec-alert",
      props: {
        type: "info",
        title: "同一页面：固定节点 + 选中容器下挂载 JSON 节点",
        description: "左侧选容器、编辑 JSON 节点片段；片段里的 {{form.xxx}} 会绑定右侧表单数据。固定节点与动态节点一起渲染。",
        showIcon: true,
      },
    },
    { id: "mm_fixed", component: "ec-input", props: { label: "固定字段（不随 JSON 变）" } },
    { id: "target_card", component: "ec-card", props: { title: "挂载容器 A · ec-card" }, children: [] },
    { id: "target_container", component: "ec-container", props: {}, children: [] },
    { id: "target_space", component: "ec-space", props: { wrap: true }, children: [] },
  ],
};

const CONTAINERS = [
  { value: "target_card", label: "挂载容器 A · 卡片" },
  { value: "target_container", label: "挂载容器 B · 基础容器" },
  { value: "target_space", label: "挂载容器 C · 弹性容器" },
];

const DEFAULT_INJECT = JSON.stringify(
  [
    { id: "mount_user", component: "ec-input", props: { label: "用户名（绑定 form.mount_user）", modelValue: "{{form.mount_user}}" } },
    { id: "mount_role", component: "ec-select", props: { label: "角色（绑定 form.mount_role）", modelValue: "{{form.mount_role}}", options: ["管理员", "编辑", "访客"] } },
    { id: "mount_show", component: "ec-text", props: { text: "回显：{{form.mount_user}} / {{form.mount_role}}" } },
  ],
  null,
  2,
);
const DEFAULT_DATA = JSON.stringify({ form: { mount_user: "王五", mount_role: "管理员" } }, null, 2);

/** 深拷贝 + 递归把节点挂到目标容器下；非目标容器原样复制 */
function mountInto(host: PageSchema, id: string, injected: NodeSchema[]): PageSchema {
  const clone = JSON.parse(JSON.stringify(host)) as PageSchema;
  const walk = (nodes: NodeSchema[]): void => {
    for (const node of nodes ?? []) {
      if (node.id === id) node.children = [...(node.children ?? []), ...injected];
      if (node.children?.length) walk(node.children);
    }
  };
  walk(clone.children ?? []);
  return clone;
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#4e5969", margin: "12px 0 6px" };
const hintStyle: React.CSSProperties = { fontSize: 11, color: "#86909c", lineHeight: 1.6, margin: "6px 0 0" };
const errorStyle: React.CSSProperties = { margin: "8px 0", padding: "6px 10px", background: "#fef0f0", border: "1px solid #fbc4c4", borderRadius: 6, color: "#c0392b", fontSize: 11 };

export function MountMappingDemo() {
  const [targetId, setTargetId] = useState<string>(CONTAINERS[0]!.value);
  const [injectText, setInjectText] = useState(DEFAULT_INJECT);
  const [dataText, setDataText] = useState(DEFAULT_DATA);
  const [injectedNodes, setInjectedNodes] = useState<NodeSchema[]>(JSON.parse(DEFAULT_INJECT) as NodeSchema[]);
  const [formData, setFormData] = useState<Record<string, unknown>>(JSON.parse(DEFAULT_DATA) as Record<string, unknown>);
  const [parseError, setParseError] = useState("");
  const [dataError, setDataError] = useState("");

  /** 防抖 300ms 解析片段 + 数据，任一失败保留上次成功结果 */
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(injectText);
        if (!Array.isArray(parsed)) throw new Error("片段必须是节点数组 [...]");
        setInjectedNodes(parsed as NodeSchema[]);
        setParseError("");
      } catch (error) {
        setParseError((error as Error).message);
      }
      try {
        const d = JSON.parse(dataText) as Record<string, unknown>;
        if (!d || typeof d !== "object") throw new Error("数据必须是对象");
        setFormData(d);
        setDataError("");
      } catch (error) {
        setDataError((error as Error).message);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [injectText, dataText]);

  /** 挂载后的完整页面：固定节点 + 注入片段 */
  const mountedPage = useMemo(() => mountInto(HOST, targetId, injectedNodes), [targetId, injectedNodes]);

  /** 当前 JSON 片段里出现的 {{...}} 绑定路径（用于演示绑定位置） */
  const bindings = useMemo(() => {
    const found = new Set<string>();
    const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(injectText))) found.add(m[1]!);
    return [...found];
  }, [injectText]);

  return (
    <section style={{ display: "flex", flex: 1, height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, flex: 1, minWidth: 0, minHeight: 0 }}>
        {/* 左：控制区 */}
        <div style={{ minWidth: 0, minHeight: 0, background: "#fff", border: "1px solid #e5e6eb", borderRadius: 8, padding: 16, overflow: "auto" }}>
          <Typography.Title level={5} style={{ margin: "0 0 12px" }}>挂载配置</Typography.Title>

          <label style={labelStyle}>挂载目标容器</label>
          <Select size="small" value={targetId} onChange={setTargetId} options={CONTAINERS} style={{ width: "100%" }} />
          <p style={hintStyle}>JSON 节点片段会挂到该容器的 children 下，与固定节点一起渲染。</p>

          <label style={labelStyle}>JSON 节点片段（{"{{form.xxx}}"} 指定绑定位置）</label>
          {parseError ? <div style={errorStyle}>片段解析失败：{parseError}</div> : null}
          <Input.TextArea
            value={injectText}
            onChange={(e) => setInjectText(e.target.value)}
            rows={12}
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.5 }}
            spellCheck={false}
          />

          <label style={labelStyle}>表单数据（{"{{}}"} 绑定的取值来源）</label>
          {dataError ? <div style={errorStyle}>数据解析失败：{dataError}</div> : null}
          <Input.TextArea
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
            rows={5}
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.5 }}
            spellCheck={false}
          />

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #e5e6eb" }}>
            <span style={labelStyle}>检测到的绑定位置</span>
            <div>
              {bindings.length ? (
                bindings.map((b) => <Tag key={b} color="blue" style={{ margin: "4px 6px 0 0" }}>{b}</Tag>)
              ) : (
                <span style={hintStyle}>JSON 里写 {"{{form.xxx}}"} 即可绑定表单数据</span>
              )}
            </div>
          </div>
        </div>

        {/* 右：完整页面渲染 */}
        <div style={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #e5e6eb", borderRadius: 8, padding: 16, overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>渲染结果 · 固定 + 动态混排</Typography.Title>
            <Tag color="success">已挂载 {injectedNodes.length} 个节点 → {targetId}</Tag>
          </div>
          <div style={{ padding: 16, background: "#fafbfc", border: "1px solid #e5e6eb", borderRadius: 6, flex: 1, minHeight: 0, overflow: "auto" }}>
            <ReactDesignProvider adapter={antdAdapter}>
              <SchemaRenderer key={`mount-${targetId}`} page={mountedPage} data={formData} />
            </ReactDesignProvider>
          </div>
        </div>
      </div>
    </section>
  );
}
