// @vitest-environment jsdom
/**
 * 输入框候选下拉（antd 侧）：无候选零回归、有候选切成 AutoComplete。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ANTD_COMPONENTS } from "../src/components";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const InputImpl = ANTD_COMPONENTS["ec-input"] as (props: Record<string, unknown>) => React.ReactNode;

function render(props: Record<string, unknown>): void {
  act(() => {
    root.render(createElement(InputImpl as never, props));
  });
}

describe("输入框：多条数据作为下拉候选", () => {
  it("没配候选时仍是普通 antd Input", () => {
    render({ value: "张三", placeholder: "请输入", onChange: vi.fn() });

    expect(container.querySelector(".ant-input")).toBeTruthy();
    expect(container.querySelector(".ant-select")).toBeNull();
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("张三");
  });

  it("配了候选项时切成 AutoComplete", () => {
    render({ value: "", options: "张三,李四", onChange: vi.fn() });

    expect(container.querySelector(".ant-select")).toBeTruthy();
  });

  it("候选项来自选项数组时同样生效", () => {
    render({
      value: "",
      options: [{ label: "张三/ZS001", value: "1" }],
      onChange: vi.fn(),
    });

    expect(container.querySelector(".ant-select")).toBeTruthy();
  });
});
