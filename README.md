# 一格 Uno

一个面向 Windows 的本地桌面文件整理工具。它会扫描你选择的源目录，按照你配置的关键词规则，先生成预览，再把命中文件移动到输出根目录下对应的分类文件夹。

当前版本使用 `Electron + React + TypeScript` 实现，界面风格参考 GitHub 的浅色工作台。

## 当前能力

- 支持拖拽文件夹或按钮选择目录
- 递归扫描单个源目录及其子目录
- 支持多条关键词规则，按顺序决定优先级
- 关键词匹配规则为：
  - 忽略大小写
  - 文件名包含任一关键词即命中
  - 多条命中时取第一条
- 执行前先生成预览
- 未命中文件保留原地
- 目标目录同名文件自动重命名，例如 `文件 (1).pdf`
- 跨盘移动失败时回退为“复制后删除”
- 保存本地规则、最近目录和最近任务日志

## 首版范围

- 仅支持 Windows
- 仅支持本地磁盘目录
- 不支持后台监听
- 不支持撤销
- 不支持网盘、SMB、NAS 等特殊路径
- 默认处理所有文件类型

## 开发环境

- Node.js 24+
- npm 11+

## 安装依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

## 测试与检查

```bash
npm test
npm run typecheck
```

## 生产构建

```bash
npm run build
```

构建输出目录：

- `out/main`
- `out/preload`
- `out/renderer`

## 打包绿色版

```bash
npm run dist
```

当前打包产物示例：

- `release/0.1.0/Uno-0.1.0-portable.exe`

## 使用流程

1. 启动程序。
2. 选择“源目录”。
3. 选择“输出根目录”。
4. 新增一条或多条规则。
5. 按规则列表顺序调整优先级。
6. 点击“预览整理”查看：
   - 将移动的文件
   - 未命中的文件
   - 错误项
7. 确认无误后点击“开始整理”。
8. 在“最近任务日志”中查看处理结果。

## 规则配置示例

| 规则名称 | 关键词 | 输出子文件夹 |
| --- | --- | --- |
| 合同 | 合同, agreement, contract | 合同 |
| 发票 | 发票, invoice | 发票 |
| 简历 | 简历, resume, cv | 简历 |

## 本地数据

程序会在 Electron 的 `userData` 目录中保存：

- 规则列表
- 最近使用的源目录和输出目录
- 最近任务日志

在 Windows 上通常位于：

```text
%APPDATA%/Uno
```

## 主要目录结构

```text
src/
  main/       Electron 主进程、IPC、文件整理服务、状态存储
  preload/    渲染层安全桥接
  renderer/   React 界面
  shared/     共享类型与整理核心逻辑
```

## 已验证命令

下面这些命令已在当前工程中实际运行通过：

```bash
npm test
npm run typecheck
npm run build
npm run dist
```
