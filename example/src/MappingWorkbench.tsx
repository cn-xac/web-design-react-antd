/**
 * 「映射测试」工作台：页内子 tab 把三块能力分开，避免上下堆叠把内容压扁。
 * - 四态测试：URL 取数的成功/失败/超时/格式异常 + 内容映射；
 * - 完整实例：JSON 解析成页面（含各种容器）+ 表单数据回填；
 * - 构建与渲染：固定构建 vs 编辑 JSON 实时渲染对比。
 */
import { useState } from "react";
import { Tabs } from "antd";
import { UrlMappingPanel } from "./UrlMappingPanel";
import { SchemaPageDemo } from "./SchemaPageDemo";
import { BuildRenderDemo } from "./BuildRenderDemo";
import { MountMappingDemo } from "./MountMappingDemo";

export function MappingWorkbench() {
  const [tab, setTab] = useState("states");

  return (
    <div
      className="mapping-workbench"
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        background: "#fff",
        border: "1px solid #e5e6eb",
        borderRadius: 8,
        padding: "0 16px 16px",
      }}
    >
      <Tabs
        className="mapping-workbench__tabs"
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "states", label: "四态测试", children: <UrlMappingPanel /> },
          { key: "full", label: "完整实例", children: <SchemaPageDemo /> },
          { key: "build", label: "构建与渲染", children: <BuildRenderDemo /> },
          { key: "mount", label: "容器挂载映射", children: <MountMappingDemo /> },
        ]}
        style={{ width: "100%" }}
      />
    </div>
  );
}
