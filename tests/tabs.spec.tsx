// @vitest-environment jsdom
/**
 * 标签页（re0BNA，antd 侧）。
 *
 * 与 EP 的 tabs.spec.ts 对齐三条契约：
 * 1. 旧成对字符串继续渲染；
 * 2. 自定义 mark 控制默认激活；
 * 3. dataPath 指向的 schema 按协议渲染成内嵌页面。
 */
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";
import { createEmptyPage, type NodeSchema, type PageSchema } from "@x-ac/web-design-core";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mountTabs(items: unknown, state: Record<string, unknown> = {}, active?: string): HTMLDivElement {
  const props: Record<string, unknown> = { items };
  if (active !== undefined) props.active = active;
  const node: NodeSchema = { id: "tabs1", component: "ec-tabs", props };
  // scope 来自 page.state：react 的 usePageStore 挂载时以 page.state 重置作用域
  const page: PageSchema = { ...createEmptyPage(), state, children: [node] };

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<SchemaRenderer page={page} ui={antdAdapter} />);
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("标签页：向后兼容与结构化标签项", () => {
  it("旧成对字符串仍能渲染多个页签", () => {
    const el = mountTabs("基本信息:第一页内容,扩展配置:第二页内容");
    expect(el.querySelectorAll(".ant-tabs-tab")).toHaveLength(2);
    expect(el.textContent).toContain("第一页内容");
  });

  it("active 支持自定义标记：mark 匹配即默认激活", () => {
    const el = mountTabs(
      [
        { id: "a", label: "概览", mark: "overview" },
        { id: "b", label: "详情", mark: "detail" },
      ],
      {},
      "detail",
    );
    const tabs = el.querySelectorAll(".ant-tabs-tab");
    expect(tabs[1].className).toContain("ant-tabs-tab-active");
  });
});

describe("标签页：内容按 schema 协议渲染为页面", () => {
  it("dataPath 指向的 schema 渲染出内嵌节点", () => {
    const data = {
      form: {
        detail: {
          children: [{ id: "n1", component: "ec-text", props: { text: "内嵌页面内容" } }],
        },
      },
    };
    const el = mountTabs([{ id: "a", label: "内嵌", dataPath: "form.detail" }], data);
    expect(el.textContent).toContain("内嵌页面内容");
  });
});

describe("标签页：pane 容器按 paneId 渲染（rGjzDs）", () => {
  it("design 页签渲染对应 pane 容器里的内容", () => {
    const page: PageSchema = {
      ...createEmptyPage(),
      children: [
        {
          id: "tabs1",
          component: "ec-tabs",
          props: { items: [{ id: "a", label: "概览", content: "design" }] },
          children: [
            {
              id: "pane_a",
              component: "ec-container",
              props: { paneId: "a" },
              children: [{ id: "t1", component: "ec-text", props: { text: "页签里的内容" } }],
            },
          ],
        },
      ],
    };

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<SchemaRenderer page={page} ui={antdAdapter} />);
    });

    expect(container.textContent).toContain("页签里的内容");
  });
});
