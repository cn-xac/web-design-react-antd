// @vitest-environment jsdom
/**
 * antd 适配包：下拉类控件的可交互性回归。
 *
 * 1. 含表达式 options 的 select 经渲染器后能展开、选项数量正确
 *    （曾因示例把 body 设成 overflow:hidden，弹层被裁掉、表现成「点不开」）；
 * 2. 组织选择必须是真正的树选择（TreeSelect），而不是只读占位 Input
 *    （旧实现是个 readOnly 的 Input，里面没有任何选项）。
 */
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { SchemaRenderer, ReactDesignProvider } from "@x-ac/web-design-react";
import { createEmptyPage, type PageSchema } from "@x-ac/web-design-core";
import { antdAdapter } from "@x-ac/web-design-react-antd";

function renderPage(page: PageSchema, seed: Record<string, unknown>) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(
      <ReactDesignProvider adapter={antdAdapter}>
        <SchemaRenderer page={page} data={seed} />
      </ReactDesignProvider>,
    );
  });
  return host;
}

/** 触发 antd 下拉：在 .ant-select 上 mousedown */
async function openSelect(host: HTMLElement): Promise<HTMLElement | null> {
  const trigger = host.querySelector<HTMLElement>(".ant-select");
  expect(trigger).toBeTruthy();
  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  });
  return document.querySelector<HTMLElement>(".ant-select-dropdown");
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("antd 下拉类控件可交互", () => {
  it("表达式 options 的 select 能展开且选项完整", async () => {
    const page = {
      ...createEmptyPage("t"),
      id: "t",
      children: [
        { id: "x_dept", component: "ec-select", props: { label: "部门", options: "{{options.x_dept}}" } },
      ],
    } as PageSchema;
    const seed = {
      form: {},
      options: {
        x_dept: [
          { label: "技术中心", value: "D001" },
          { label: "产品中心", value: "D002" },
        ],
      },
    };

    const host = renderPage(page, seed);
    const dropdown = await openSelect(host);
    expect(dropdown).toBeTruthy();
    expect(dropdown!.classList.contains("ant-select-dropdown-hidden")).toBe(false);
    expect(document.querySelectorAll(".ant-select-item-option")).toHaveLength(2);
  });

  it("组织选择是 TreeSelect（dropdown 里是树，不是空只读框）", async () => {
    const page = {
      ...createEmptyPage("t"),
      id: "t2",
      children: [{ id: "n_org", component: "ec-org-picker", props: { label: "所属组织" } }],
    } as PageSchema;

    const host = renderPage(page, { form: {} });
    const dropdown = await openSelect(host);
    expect(dropdown).toBeTruthy();
    // TreeSelect 的弹层里是 .ant-select-tree；只读 Input 根本不会有弹层
    expect(document.querySelector(".ant-select-tree")).toBeTruthy();
  });
});
