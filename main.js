const {
    Plugin,
    PluginSettingTab,
    Setting,
    Notice,
    TFile
} = require("obsidian");

const VALUE_CLASS = "file-list-details-value";
const BELOW_CLASS = "file-list-details--below";
const COMBINED_CLASS = "file-list-details--combined";

const DEFAULT_SETTINGS = {
    position: "auto",
    contentMode: "time",
    propertyName: "",
    customText: "",
    filterMode: "always",
    filterProperty: "",
    filterValue: ""
};

module.exports = class FileListDetailsPlugin extends Plugin {
    async onload() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );

        this.refreshTimer = null;

        this.registerEvent(
            this.app.vault.on("modify", () => this.scheduleRefresh())
        );

        this.registerEvent(
            this.app.vault.on("rename", () => this.scheduleRefresh())
        );

        this.registerEvent(
            this.app.vault.on("delete", () => this.scheduleRefresh())
        );

        this.registerEvent(
            this.app.metadataCache.on("changed", () => this.scheduleRefresh())
        );

        this.registerEvent(
            this.app.workspace.on("layout-change", () => this.scheduleRefresh())
        );

        this.rowResizeObserver = new ResizeObserver((entries) => {
            if (this.settings.position === "auto") {
                for (const entry of entries) {
                    this.updateRowLayout(entry.target);
                }
            }
        });

        this.register(() => {
            this.rowResizeObserver.disconnect();
        });

        this.domObserver = new MutationObserver(() => {
            this.scheduleRefresh();
        });

        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.register(() => {
            this.domObserver.disconnect();
        });

        this.addSettingTab(
            new FileListDetailsSettingTab(this.app, this)
        );

        this.refreshFileList();
    }

    onunload() {
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        document
            .querySelectorAll("." + VALUE_CLASS)
            .forEach((element) => element.remove());

        document
            .querySelectorAll("." + BELOW_CLASS)
            .forEach((element) => {
                element.classList.remove(BELOW_CLASS);
            });

        document
            .querySelectorAll("." + COMBINED_CLASS)
            .forEach((element) => {
                element.classList.remove(COMBINED_CLASS);
            });
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.refreshFileList();
    }

    scheduleRefresh() {
        if (this.refreshTimer !== null) {
            return;
        }

        this.refreshTimer = window.setTimeout(() => {
            this.refreshTimer = null;
            this.refreshFileList();
        }, 120);
    }

    refreshFileList() {
        const rows = document.querySelectorAll(
            ".nav-file-title[data-path]"
        );

        rows.forEach((row) => {
            this.decorateRow(row);

            if (!row.dataset.fileListDetailsObserved) {
                this.rowResizeObserver.observe(row);
                row.dataset.fileListDetailsObserved = "true";
            }
        });
    }

    decorateRow(row) {
        const path = row.dataset.path;

        if (!path) {
            return;
        }

        const file = this.app.vault.getAbstractFileByPath(path);

        if (!(file instanceof TFile)) {
            this.removeValue(row);
            return;
        }

        const displayText = this.getDisplayText(file);

        if (!displayText) {
            this.removeValue(row);
            return;
        }

        let valueElement = row.querySelector(
            "." + VALUE_CLASS
        );

        if (!valueElement) {
            valueElement = document.createElement("span");
            valueElement.className = VALUE_CLASS;
            valueElement.setAttribute("aria-hidden", "true");
            row.appendChild(valueElement);
        }

        valueElement.textContent = displayText;
        valueElement.title = displayText;

        row.classList.toggle(
            COMBINED_CLASS,
            this.settings.contentMode === "time-property"
        );

        this.applyPosition(row);

        window.requestAnimationFrame(() => {
            this.updateRowLayout(row);
        });
    }

    removeValue(row) {
        const valueElement = row.querySelector(
            "." + VALUE_CLASS
        );

        if (valueElement) {
            valueElement.remove();
        }

        row.classList.remove(BELOW_CLASS);
        row.classList.remove(COMBINED_CLASS);
    }

    applyPosition(row) {
        row.classList.remove(BELOW_CLASS);

        if (this.settings.position === "below") {
            row.classList.add(BELOW_CLASS);
        }
    }

    updateRowLayout(row) {
        if (!row.isConnected) {
            return;
        }

        const valueElement = row.querySelector(
            "." + VALUE_CLASS
        );

        if (!valueElement) {
            return;
        }

        if (this.settings.position === "right") {
            row.classList.remove(BELOW_CLASS);
            return;
        }

        if (this.settings.position === "below") {
            row.classList.add(BELOW_CLASS);
            return;
        }

        const titleElement = row.querySelector(
            ".nav-file-title-content"
        );

        if (!titleElement) {
            return;
        }

        const rowWidth = row.getBoundingClientRect().width;

        if (rowWidth <= 0) {
            return;
        }

        row.classList.remove(BELOW_CLASS);

        const titleWidth = this.getNaturalTitleWidth(titleElement);
        const valueWidth = valueElement.getBoundingClientRect().width;
        const requiredWidth = titleWidth + valueWidth + 28;

        if (requiredWidth > rowWidth) {
            row.classList.add(BELOW_CLASS);
        }
    }

    getNaturalTitleWidth(titleElement) {
        const clone = titleElement.cloneNode(true);

        clone.style.position = "absolute";
        clone.style.visibility = "hidden";
        clone.style.pointerEvents = "none";
        clone.style.width = "max-content";
        clone.style.maxWidth = "none";
        clone.style.minWidth = "max-content";
        clone.style.overflow = "visible";
        clone.style.textOverflow = "clip";
        clone.style.whiteSpace = "nowrap";
        clone.style.flex = "none";

        document.body.appendChild(clone);

        const width = clone.getBoundingClientRect().width;

        clone.remove();

        return width;
    }

    getDisplayText(file) {
        if (!this.matchesFilter(file)) {
            return "";
        }

        if (this.settings.contentMode === "time") {
            return this.formatTime(file.stat.mtime);
        }

        if (this.settings.contentMode === "property") {
            return this.stringifyValue(
                this.getPropertyValue(
                    file,
                    this.settings.propertyName
                )
            );
        }

        if (this.settings.contentMode === "text") {
            return this.renderTemplate(
                file,
                this.settings.customText
            );
        }

        if (this.settings.contentMode === "time-property") {
            const time = this.formatTime(file.stat.mtime);
            const property = this.stringifyValue(
                this.getPropertyValue(
                    file,
                    this.settings.propertyName
                )
            );

            if (!property) {
                return time;
            }

            return time + " · " + property;
        }

        return "";
    }

    matchesFilter(file) {
        if (this.settings.filterMode === "always") {
            return true;
        }

        const value = this.getPropertyValue(
            file,
            this.settings.filterProperty
        );

        if (this.settings.filterMode === "has-property") {
            return (
                value !== undefined &&
                value !== null &&
                value !== ""
            );
        }

        if (this.settings.filterMode === "equals") {
            return (
                this.stringifyValue(value) ===
                String(this.settings.filterValue || "")
            );
        }

        return true;
    }

    getPropertyValue(file, propertyName) {
        const name = String(propertyName || "").trim();

        if (!name) {
            return undefined;
        }

        const cache = this.app.metadataCache.getFileCache(file);

        if (!cache || !cache.frontmatter) {
            return undefined;
        }

        return cache.frontmatter[name];
    }

    stringifyValue(value) {
        if (value === undefined || value === null) {
            return "";
        }

        if (Array.isArray(value)) {
            return value.join(", ");
        }

        if (typeof value === "object") {
            return Object.values(value).join(", ");
        }

        return String(value);
    }

    renderTemplate(file, template) {
        const propertyValue = this.getPropertyValue(
            file,
            this.settings.propertyName
        );

        const date = new Date(file.stat.mtime);

        const values = {
            name: file.basename,
            path: file.path,
            property: this.stringifyValue(propertyValue),
            date: this.formatDate(date),
            time: this.formatClockTime(date)
        };

        return String(template || "").replace(
            /\{(name|path|property|date|time)\}/g,
            (_match, key) => values[key]
        );
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        if (date.getFullYear() === now.getFullYear()) {
            return (
                this.pad(date.getMonth() + 1) +
                "-" +
                this.pad(date.getDate()) +
                " " +
                this.formatClockTime(date)
            );
        }

        return (
            date.getFullYear() +
            "-" +
            this.pad(date.getMonth() + 1) +
            "-" +
            this.pad(date.getDate())
        );
    }

    formatDate(date) {
        return (
            date.getFullYear() +
            "-" +
            this.pad(date.getMonth() + 1) +
            "-" +
            this.pad(date.getDate())
        );
    }

    formatClockTime(date) {
        return (
            this.pad(date.getHours()) +
            ":" +
            this.pad(date.getMinutes())
        );
    }

    pad(value) {
        return String(value).padStart(2, "0");
    }
};

class FileListDetailsSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const container = this.containerEl;
        container.empty();

        container.createEl("h2", {
            text: "文件列表备注"
        });

        container.createEl("p", {
            text: "在左侧原生文件列表中，为笔记名称补充时间、属性或自定义备注。插件不会修改笔记内容。",
            cls: "file-list-details-help"
        });

        new Setting(container)
            .setName("显示位置")
            .setDesc(
                "自动判断适合的位置；也可以固定显示在标题右侧或标题下方。"
            )
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("auto", "自动判断")
                    .addOption("right", "永远显示在标题右侧")
                    .addOption("below", "永远显示在标题下方")
                    .setValue(this.plugin.settings.position)
                    .onChange(async (value) => {
                        this.plugin.settings.position = value;

                        if (
                            this.plugin.settings.contentMode ===
                                "time-property" &&
                            value !== "below"
                        ) {
                            this.plugin.settings.position = "below";

                            new Notice(
                                "同时显示时间和属性时，显示位置已调整为标题下方。"
                            );
                        }

                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        new Setting(container)
            .setName("显示内容")
            .setDesc(
                "选择文件列表中需要看到的信息。"
            )
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("time", "文件修改时间")
                    .addOption("property", "笔记属性值")
                    .addOption("text", "自定义文字")
                    .addOption(
                        "time-property",
                        "修改时间 + 笔记属性值"
                    )
                    .setValue(this.plugin.settings.contentMode)
                    .onChange(async (value) => {
                        this.plugin.settings.contentMode = value;

                        if (
                            value === "time-property" &&
                            this.plugin.settings.position !== "below"
                        ) {
                            this.plugin.settings.position = "below";

                            new Notice(
                                "同时显示两类内容时，显示位置已调整为标题下方。"
                            );
                        }

                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        const needsPropertyName =
            this.plugin.settings.contentMode === "property" ||
            this.plugin.settings.contentMode === "time-property" ||
            (
                this.plugin.settings.contentMode === "text" &&
                this.plugin.settings.customText.includes("{property}")
            );

        if (needsPropertyName) {
            new Setting(container)
                .setName("属性名称")
                .setDesc(
                    "填写笔记顶部属性区域中的名称。例如笔记有 status: 进行中，就填写 status。"
                )
                .addText((text) => {
                    text.setPlaceholder("例如：status")
                        .setValue(
                            this.plugin.settings.propertyName
                        )
                        .onChange(async (value) => {
                            this.plugin.settings.propertyName = value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        if (this.plugin.settings.contentMode === "text") {
            new Setting(container)
                .setName("自定义文字")
                .setDesc(
                    "可以填写固定备注，也可以使用 {property}、{date}、{time}、{name} 和 {path}。例如：状态：{property}"
                )
                .addTextArea((text) => {
                    text.setPlaceholder(
                        "例如：状态：{property}"
                    )
                        .setValue(
                            this.plugin.settings.customText
                        )
                        .onChange(async (value) => {
                            this.plugin.settings.customText = value;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });
        }

        new Setting(container)
            .setName("显示条件")
            .setDesc(
                "可以让备注只出现在部分笔记中。例如只显示 status 为进行中的笔记。"
            )
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("always", "所有笔记")
                    .addOption(
                        "has-property",
                        "包含指定属性的笔记"
                    )
                    .addOption(
                        "equals",
                        "属性值等于指定文字的笔记"
                    )
                    .setValue(this.plugin.settings.filterMode)
                    .onChange(async (value) => {
                        this.plugin.settings.filterMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.filterMode !== "always") {
            new Setting(container)
                .setName("条件属性名称")
                .setDesc(
                    "例如填写 status，插件会根据每篇笔记的 status 判断是否显示备注。"
                )
                .addText((text) => {
                    text.setPlaceholder("例如：status")
                        .setValue(
                            this.plugin.settings.filterProperty
                        )
                        .onChange(async (value) => {
                            this.plugin.settings.filterProperty = value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        if (this.plugin.settings.filterMode === "equals") {
            new Setting(container)
                .setName("条件属性值")
                .setDesc(
                    "例如条件属性名称填写 status，这里填写 进行中。"
                )
                .addText((text) => {
                    text.setPlaceholder("例如：进行中")
                        .setValue(
                            this.plugin.settings.filterValue
                        )
                        .onChange(async (value) => {
                            this.plugin.settings.filterValue = value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        const guide = container.createDiv({
            cls: "file-list-details-guide"
        });

        guide.createEl("h3", {
            text: "常用设置示例"
        });

        guide.createEl("p", {
            text: "只显示更新时间：选择“文件修改时间”，位置可以选择“自动判断”。"
        });

        guide.createEl("p", {
            text: "显示属性内容：选择“笔记属性值”，再填写属性名称，例如 status。"
        });

        guide.createEl("p", {
            text: "同时显示时间和属性：选择“修改时间 + 笔记属性值”。插件会自动改为标题下方的两行布局。"
        });

        guide.createEl("p", {
            text: "自定义备注：选择“自定义文字”。例如填写“状态：{property}”，就会显示指定属性的实际内容。"
        });

        guide.createEl("p", {
            text: "注意：这里读取的是笔记顶部的属性区域，不会把任何内容写回笔记。"
        });
    }
}
