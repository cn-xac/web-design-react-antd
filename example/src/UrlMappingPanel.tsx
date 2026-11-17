/**
 * 「映射测试」页：URL 获取数据 → 标签内容映射的端到端测试台。
 *
 * 场景：输入/选择 URL → 发起请求 → 观察请求状态（成功 / 失败 / 超时 / 格式异常）→
 * 查看原始返回数据 → 查看按 display 模板 + listField 做的内容映射结果。
 *
 * 映射逻辑全部来自 ./url-mapping，口径与 core 的 renderDisplay / normalizeResponse 一致；
 * 本组件只负责表单与结果展示，不改引擎、不碰现有外部数据源接口。
 */
import { useState } from "react";
import { Button, Input, InputNumber, Select, Tag, Typography } from "antd";
import { TEST_API } from "./mock/install-mock";
import {
  fetchAndMap,
  type FetchAndMapOptions,
  type MappingOutcome,
  type MappingShape,
  type RequestPhase,
} from "./url-mapping";

interface FormState {
  url: string;
  timeout: number;
  display: string;
  listField: string;
  shape: MappingShape;
  labelField: string;
  valueField: string;
}

const PRESETS: Array<{ label: string; url: string; hint: string }> = [
  { label: "成功", url: TEST_API.success, hint: "200 + 平铺对象，display 模板可取 {{data.*}}" },
  { label: "失败", url: TEST_API.failure, hint: "500 服务端异常" },
  { label: "超时", url: TEST_API.timeout, hint: "8s 延迟，面板 2s 超时中断" },
  { label: "格式异常", url: TEST_API.badFormat, hint: "200 但返回 HTML，非 JSON" },
];

const PHASE_LABEL: Record<RequestPhase, string> = {
  idle: "未发起",
  loading: "请求中…",
  success: "成功",
  "http-error": "请求失败",
  timeout: "超时",
  "format-error": "数据格式异常",
  "network-error": "网络错误",
};

const INITIAL_FORM: FormState = {
  url: TEST_API.success,
  timeout: 2000,
  display: "{{data.name}} · {{data.deptName}}",
  listField: "",
  shape: "form",
  labelField: "name",
  valueField: "deptName",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#4e5969",
  marginTop: 4,
};
const cellTitleStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: 13, color: "#4e5969" };
const codeStyle: React.CSSProperties = {
  margin: 0,
  padding: 10,
  background: "#f7f8fa",
  border: "1px solid #e5e6eb",
  borderRadius: 6,
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  maxHeight: 360,
  overflow: "auto",
  color: "#1d2129",
};

export function UrlMappingPanel() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [outcome, setOutcome] = useState<MappingOutcome | null>(null);
  const running = outcome?.phase === "loading";

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }));

  const usePreset = (preset: { url: string; hint: string }) => {
    setForm((prev) => ({ ...prev, url: preset.url }));
    setOutcome({
      phase: "idle",
      status: null,
      elapsed: 0,
      message: preset.hint,
      rawText: "",
      mapped: null,
    });
  };

  const run = async () => {
    if (!form.url.trim() || running) return;
    const options: FetchAndMapOptions = {
      url: form.url.trim(),
      timeout: Math.max(0, Number(form.timeout) || 0),
      display: form.display,
      listField: form.listField,
      shape: form.shape,
      labelField: form.labelField,
      valueField: form.valueField,
      scope: {},
    };
    setOutcome({
      phase: "loading",
      status: null,
      elapsed: 0,
      message: "请求中…",
      rawText: "",
      mapped: null,
    });
    setOutcome(await fetchAndMap(options));
  };

  const phase = outcome?.phase ?? "idle";
  const statusColor =
    phase === "success" ? "green" : phase === "loading" ? "blue" : phase === "idle" ? "default" : "red";

  return (
    <section style={{ display: "flex", gap: 16, flex: 1, height: "100%", minHeight: 0 }}>
      <div
        style={{
          width: 380,
          flex: "0 0 380px",
          background: "#fff",
          border: "1px solid #e5e6eb",
          borderRadius: 8,
          padding: 18,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          URL 映射测试台
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 4 }}>
          输入或选择 URL → 发起请求 → 查看请求状态、原始返回与内容映射结果。映射口径与运行时{" "}
          <code>display</code> 模板一致，不改现有外部数据源接口。
        </Typography.Paragraph>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map((preset) => (
            <Button
              key={preset.url}
              size="small"
              type={form.url === preset.url ? "primary" : "default"}
              onClick={() => usePreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <label style={labelStyle}>请求地址 URL</label>
        <Input
          size="small"
          value={form.url}
          placeholder="/mock/api/test/success 或任意 http(s) 地址"
          onChange={(e) => patch({ url: e.target.value })}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>超时（ms，0=不限）</label>
            <InputNumber
              size="small"
              min={0}
              step={500}
              value={form.timeout}
              onChange={(v) => patch({ timeout: Number(v ?? 0) })}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>归一化形态</label>
            <Select
              size="small"
              value={form.shape}
              onChange={(v) => patch({ shape: v })}
              style={{ width: "100%" }}
              options={[
                { label: "form（内容文本）", value: "form" },
                { label: "select（选项映射）", value: "select" },
              ]}
            />
          </div>
        </div>

        <label style={labelStyle}>display 模板（{"{{data.字段}}"}）</label>
        <Input
          size="small"
          value={form.display}
          placeholder="{{data.name}} · {{data.deptName}}"
          onChange={(e) => patch({ display: e.target.value })}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>列表字段 listField</label>
            <Input
              size="small"
              value={form.listField}
              placeholder="留空=响应即数据"
              onChange={(e) => patch({ listField: e.target.value })}
            />
          </div>
          {form.shape === "select" ? (
            <>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelStyle}>label 字段</label>
                <Input size="small" value={form.labelField} onChange={(e) => patch({ labelField: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelStyle}>value 字段</label>
                <Input size="small" value={form.valueField} onChange={(e) => patch({ valueField: e.target.value })} />
              </div>
            </>
          ) : null}
        </div>

        <Button type="primary" loading={running} onClick={run} style={{ alignSelf: "flex-start", marginTop: 8 }}>
          {running ? "请求中…" : "发起请求"}
        </Button>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: "#fff",
          border: "1px solid #e5e6eb",
          borderRadius: 8,
          padding: 18,
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 6,
            background: "#f7f8fa",
            border: "1px solid #e5e6eb",
          }}
        >
          <Tag color={statusColor}>{PHASE_LABEL[phase]}</Tag>
          {outcome?.status !== null && outcome?.status !== undefined ? (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              HTTP {outcome.status}
            </Typography.Text>
          ) : null}
          {outcome?.elapsed ? (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {outcome.elapsed}ms
            </Typography.Text>
          ) : null}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {outcome?.message ?? "选择场景或输入 URL 后点击发起请求"}
          </Typography.Text>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
          <div style={{ minWidth: 0 }}>
            <h4 style={cellTitleStyle}>原始返回数据</h4>
            <pre style={codeStyle}>{outcome?.rawText || "（暂无）"}</pre>
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={cellTitleStyle}>映射结果</h4>
            {outcome?.mapped ? (
              <>
                {form.shape === "form" ? (
                  <div
                    style={{
                      minHeight: 60,
                      padding: 14,
                      background: "#f0fdf4",
                      border: "1px solid #b7ebc8",
                      borderRadius: 6,
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#0a7a3d",
                      lineHeight: 1.6,
                    }}
                  >
                    {outcome.mapped.text || "（模板未取到值）"}
                  </div>
                ) : (
                  <pre style={codeStyle}>{JSON.stringify(outcome.mapped.options, null, 2)}</pre>
                )}
                <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: "8px 0 0" }}>
                  取到 {outcome.mapped.rows.length} 条数据 ·
                  {form.shape === "form" ? "form 形态按模板渲染首条" : "select 形态逐项映射 label/value"}
                </Typography.Paragraph>
              </>
            ) : (
              <pre style={codeStyle}>（请求未成功，无映射结果）</pre>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
