/**
 * 完整实例：验证「JSON 数据解析成页面，包含各种容器」。
 *
 * 链路：URL 拉取遵循 Schema 协议的 JSON → SchemaRenderer 按协议渲染成真实页面
 * （card / row+col 栅格 / tabs 页签 / subform 子表单等容器嵌套）→
 * Schema.state.form 的表单数据通过 {{form.xxx}} 绑定回填到控件。
 *
 * 与四态测试台一样，不改引擎：SchemaRenderer 是引擎现成入口，这里只做示例装配。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Typography } from "antd";
import type { PageSchema } from "@x-ac/web-design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";
import { TEST_API } from "./mock/install-mock";
import { fetchSchemaPage } from "./url-mapping";

export function SchemaPageDemo() {
  const [url, setUrl] = useState<string>(TEST_API.schemaPage);
  const [page, setPage] = useState<PageSchema | null>(null);
  const [formText, setFormText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSchema, setShowSchema] = useState(false);

  const load = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    const result = await fetchSchemaPage(url.trim(), 2000);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setPage(null);
      return;
    }
    const next = result.page as unknown as PageSchema;
    setPage(next);
    // 把 Schema.state.form 填进编辑框，用户可现场改值验证表单数据映射
    setFormText(JSON.stringify(next.state?.form ?? {}, null, 2));
  }, [url]);

  useEffect(() => {
    void load();
    // 仅首次加载；url 变化由「重新加载」按钮触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 编辑框是数据的唯一来源：解析失败回退到 Schema.state.form，避免脏 JSON 白屏 */
  const renderData: Record<string, unknown> | undefined = page
    ? (() => {
        try {
          const parsed = JSON.parse(formText) as Record<string, unknown>;
          return parsed && typeof parsed === "object" ? parsed : (page.state as Record<string, unknown>);
        } catch {
          return page.state as Record<string, unknown>;
        }
      })()
    : undefined;

  /** 渲染器内部改值时同步回编辑框，实现双向绑定演示 */
  const onDataChange = useCallback((data: Record<string, unknown>) => {
    setFormText(JSON.stringify(data, null, 2));
  }, []);

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        minHeight: 0,
        background: "#fff",
        border: "1px solid #e5e6eb",
        borderRadius: 8,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            完整实例 · JSON 解析成页面（含各种容器）
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, lineHeight: 1.7, margin: "4px 0 0" }}>
            URL 返回遵循 Schema 协议的 JSON → 渲染成真实页面（卡片 / 栅格 / 页签 / 子表单）→{" "}
            <code>Schema.state.form</code> 经 <code>{"{{form.xxx}}"}</code> 回填。可编辑下方表单数据验证映射。
          </Typography.Paragraph>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input size="small" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Schema JSON 的 URL" style={{ width: 260 }} />
          <Button size="small" type="primary" loading={loading} onClick={load}>
            重新加载
          </Button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "#fef0f0",
            border: "1px solid #fbc4c4",
            borderRadius: 6,
            color: "#c0392b",
            fontSize: 13,
          }}
        >
          加载失败：{error}
        </div>
      ) : null}

      {page ? (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, marginTop: 14, flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#4e5969" }}>表单数据（映射到页面控件）</h4>
              <Button type="link" size="small" onClick={() => setShowSchema((v) => !v)}>
                {showSchema ? "收起 Schema JSON" : "查看 Schema JSON"}
              </Button>
            </div>
            <Input.TextArea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              rows={10}
              style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.5 }}
              placeholder="JSON 对象，键对应控件的 form.xxx"
            />
            {showSchema ? (
              <pre
                style={{
                  margin: "8px 0 0",
                  padding: 10,
                  background: "#f7f8fa",
                  border: "1px solid #e5e6eb",
                  borderRadius: 6,
                  fontSize: 11,
                  lineHeight: 1.5,
                  maxHeight: 300,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {JSON.stringify(page, null, 2)}
              </pre>
            ) : null}
            <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: "8px 0 0", lineHeight: 1.6 }}>
              页面与数据均来自同一个 JSON：修改上方数据后，右侧控件的回填值随之变化（双向绑定）。
            </Typography.Paragraph>
          </div>

          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#4e5969" }}>渲染结果 · 由 JSON 生成的真实页面</h4>
            <div
              style={{
                padding: 16,
                background: "#fafbfc",
                border: "1px solid #e5e6eb",
                borderRadius: 6,
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <ReactDesignProvider adapter={antdAdapter}>
                <SchemaRenderer key={page.id} page={page} data={renderData} onDataChange={onDataChange} />
              </ReactDesignProvider>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div style={{ marginTop: 14, color: "#86909c", fontSize: 13 }}>未加载到 Schema 页面</div>
      ) : null}
    </section>
  );
}
