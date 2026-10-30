# Explorer Details (文件列表备注)

> **See modification times, note properties, and custom labels right inside Obsidian's native File Explorer—without replacing your file tree.**  
> **在不替换 Obsidian 原生文件列表的前提下，直接在笔记旁展示修改时间、YAML 属性值与自定义备注。**

[English](#features) | [中文说明](#中文说明)

<!-- Drag and drop your screenshot or 5-second demo GIF of the File Explorer right below in the GitHub web editor -->
<img width="592" height="285" alt="PixPin_2026-10-31_04-57-07" src="https://github.com/user-attachments/assets/47f19dff-c85d-4400-86b9-f6e333363557" />

---

## Features

- **Native & Non-Intrusive**: Enhances Obsidian's built-in File Explorer directly without replacing your familiar file browser or modifying any note content.
- **Flexible Metadata Display**:
  - Show **file modification time** for each note.
  - Show any **YAML note property value** (e.g., `status`, `Summary`, `author`).
  - Show **modification time + property value** together (e.g., `10-13 20:45 · In progress`).
  - Define **custom text templates** using placeholders: `{name}`, `{path}`, `{property}`, `{date}`, and `{time}`.
- **Smart Responsive Layout**: Place details automatically on the right when space permits, or automatically wrap them neatly below long note titles when the sidebar is narrow.
- **Conditional Filtering**: Only display details on notes that match specific property conditions (e.g., only show when `status` equals `In progress`).
- **100% Local & Private**: Zero network requests, zero telemetry, and never alters your Frontmatter or Markdown files.

---

## Installation

### Option 1: Obsidian Community Plugins

1. Open **Settings -> Community plugins** in Obsidian.
2. Search for **Explorer Details**.
3. Click **Install** and **Enable**.

### Option 2: Using BRAT

1. Install and enable the **BRAT** plugin.
2. Click **Add Beta plugin** and enter:

```text
https://github.com/Curelove/file-list-details
```

3. Enable **Explorer Details** in Community plugins.

### Option 3: Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/Curelove/file-list-details/releases).
2. Place them into the following folder inside your vault:

```text
.obsidian/plugins/file-list-details/
```

3. Reload Obsidian and enable **Explorer Details** in Settings -> Community plugins.

---

## Quick Usage Examples

Open **Settings -> Explorer Details** to configure how metadata appears:

### 1. Show Time and Property Together

Configure the following options:

```text
Display content: Modification time + note property value
Property name: status
Display position: Always below the title
```

Example output in File Explorer:

```text
Project plan
10-13 20:45 · In progress
```

### 2. Custom Template Placeholders

Choose `Custom text` and enter a template such as `Status: {property}` or `{name} · {date} {time}`. Supported placeholders:

- `{name}`: Note name without the `.md` extension
- `{path}`: File path inside the vault
- `{property}`: Value of the configured YAML property
- `{date}`: File modification date
- `{time}`: File modification time

### 3. Filter Notes by Property

Use `Display condition` to show badges only on matching notes:

```text
Display condition: Property value equals specified text
Condition property name: status
Condition property value: In progress
```

---

## 中文说明

**Explorer Details（文件列表备注）** 是一款轻量、无侵入的 Obsidian 原生文件列表增强插件。它不需要你改变原有的文件夹使用习惯，直接在左侧原生文件树中为每篇笔记挂上直观的「状态副标题」。

### 核心亮点

- **四种显示模式**：支持单显「文件修改时间」、单显「指定笔记属性（Properties）」、组合显示「时间 + 属性值」，或使用 `{name}`、`{path}`、`{property}`、`{date}`、`{time}` 占位符拼接自定义模板。
- **自适应防挤压排版**：侧边栏宽敞时优雅右对齐；当侧边栏收窄或笔记标题过长时，自动切换至标题正下方显示，绝不挤乱文件树。
- **按条件精准展示**：支持设置过滤条件（例如仅当笔记包含某属性，或 `status` 等于 `进行中` 时才显示备注），保持文件树干净清爽。
- **绝对安全**：仅只读读取当前仓库的元数据与属性，绝不修改任何笔记正文或 YAML 属性，无任何网络请求。

---

## Compatibility & License

- Tested with Obsidian `1.13.7+`.
- Released under the [MIT License](LICENSE). If you encounter any issues, please open a [GitHub Issue](https://github.com/Curelove/file-list-details/issues).
