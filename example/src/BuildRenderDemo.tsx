/**
 * 新示例 · 构建与渲染对比（左右两半）：
 * - 左「固定构建」：一份预先构建好的 Schema，直接渲染成页面（含各种容器）。
 * - 右「编辑构建」：可编辑的 Schema JSON，输入后防抖实时渲染；也可「从接口加载」把
 *   远端 Schema 填进编辑器再渲染，演示「通过接口获取并渲染」。
 *
 * 两条路径最终都走 SchemaRenderer，证明「同一份 Schema，无论写死还是接口来，
 * 都能解析成同样的页面」。不改引擎。
 */
import { useEffect, useState } from "react";
import { Button, Input, Tag } from "antd";
import type { PageSchema } from "@x-ac/web-design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";
import { TEST_API } from "./mock/install-mock";
import { fetchSchemaPage } from "./url-mapping";
import builtSchema from "./mock/schema-page.json";

const STARTER: PageSchema = {
  schemaVersion: "1.3.0",
  id: "page_live_edit",
  type: "page",
  meta: { title: "实时编辑构建" },
  state: { form: { live_name: "改我试试", live_note: "这段来自 state.form" } },
  children: [
    { id: "live_title", component: "ec-title", props: { text: "我在编辑 JSON 构建页面", level: 3 } },
    {
      id: "live_card",
      component: "ec-card",
      props: { title: "卡片容器", shadow: "never" },
      children: [
        { id: "live_name", component: "ec-input", props: { label: "姓名" } },
        { id: "live_note", component: "ec-textarea", props: { label: "备注", rows: 2, type: "textarea" } },
      ],
    },
  ],
};

const builtPage = builtSchema as unknown as PageSchema;

const canvasStyle: React.CSSProperties = {
  padding: 12,
  background: "#fafbfc",
  border: "1px solid #e5e6eb",
  borderRadius: 6,
  maxHeight: 520,
  overflow: "auto",
  minHeight: 200,
};
const descStyle: React.CSSProperties = { margin: "6px 0 10px", fontSize: 12, lineHeight: 1.7, color: "#86909c" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 14, color: "#1d2129" };
const errorStyle: React.CSSProperties = {
  marginBottom: 8,
  padding: "8px 10px",
  background: "#fef0f0",
  border: "1px solid #fbc4c4",
  borderRadius: 6,
  color: "#c0392b",
  fontSize: 12,
};

export function BuildRenderDemo() {
  const [editorText, setEditorText] = useState(JSON.stringify(STARTER, null, 2));
  const [livePage, setLivePage] = useState<PageSchema>(STARTER);
  const [parseError, setParseError] = useState("");
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState<string>(TEST_API.schemaPage);
  const [remoteError, setRemoteError] = useState("");

  /** 防抖 300ms 再解析渲染，避免逐字输入时反复重挂载 */
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(editorText) as PageSchema;
        if (!parsed || !Array.isArray(parsed.children)) throw new Error("缺少 children 数组");
        setLivePage(parsed);
        setParseError("");
      } catch (error) {
        // 保留上一次成功渲染的页面，不因半截 JSON 白屏
        setParseError((error as Error).message);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [editorText]);

  const loadFromApi = async () => {
    if (!remoteUrl.trim()) return;
    setLoadingRemote(true);
    setRemoteError("");
    const result = await fetchSchemaPage(remoteUrl.trim(), 2000);
    setLoadingRemote(false);
    if (!result.ok) {
      setRemoteError(result.message);
      return;
    }
    // 接口内容填进编辑器 → 走同一条实时渲染链路
    setEditorText(JSON.stringify(result.page, null, 2));
  };

  return (
    <section style={{ display: "flex", flex: 1, height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, minWidth: 0, minHeight: 0 }}>
        {/* 左：固定构建好的 Schema，直接渲染 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            background: "#fff",
            border: "1px solid #e5e6eb",
            borderRadius: 8,
            padding: 16,
            overflow: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h3 style={titleStyle}>固定构建 · 直接渲染</h3>
            <Tag color="success">预构建 · {builtPage.children?.length ?? 0} 个顶层节点</Tag>
          </div>
          <p style={descStyle}>
            事先构建好、写死在示例里的 Schema（卡片 / 栅格 / 页签 / 子表单）。引擎按协议解析成页面，字段由{" "}
            <code>{"{{form.xxx}}"}</code> 回填。
          </p>
          <div style={canvasStyle}>
            <ReactDesignProvider adapter={antdAdapter}>
              <SchemaRenderer key={`built-${builtPage.id}`} page={builtPage} data={builtPage.state} />
            </ReactDesignProvider>
          </div>
        </div>

        {/* 右：编辑 JSON 实时渲染 + 从接口加载 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            background: "#fff",
            border: "1px solid #e5e6eb",
            borderRadius: 8,
            padding: 16,
            overflow: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h3 style={titleStyle}>编辑 JSON · 实时渲染</h3>
            <Tag color={parseError ? "error" : "blue"}>{parseError ? "JSON 有误" : "实时解析中"}</Tag>
          </div>
          <p style={descStyle}>
            直接改下方 Schema JSON（改字段、加容器），停止输入 300ms 后实时重渲染；也可从接口拉取 Schema 填进编辑器。
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input size="small" value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} placeholder="Schema JSON 的 URL" />
            <Button size="small" loading={loadingRemote} onClick={loadFromApi}>
              从接口加载
            </Button>
          </div>
          {remoteError ? <div style={errorStyle}>接口加载失败：{remoteError}</div> : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1, minHeight: 0 }}>
            <Input.TextArea
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              rows={14}
              style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.5, minHeight: 360 }}
              spellCheck={false}
            />
            <div style={{ ...canvasStyle, minHeight: 360 }}>
              {parseError ? <div style={errorStyle}>JSON 解析失败：{parseError}（下方仍是上次成功的渲染）</div> : null}
              <ReactDesignProvider adapter={antdAdapter}>
                <SchemaRenderer key={`live-${livePage.id}`} page={livePage} data={livePage.state} />
              </ReactDesignProvider>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
