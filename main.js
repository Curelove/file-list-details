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
const OBSERVED_DATA_KEY = "fileListDetailsObserved";

const DEFAULT_SETTINGS = {
    language: "auto",
    position: "auto",
    contentMode: "time",
    propertyName: "",
    customText: "",
    filterMode: "always",
    filterProperty: "",
    filterValue: ""
};

const TEXT = {
    zh: {
        settingsTitle: "文件列表备注",
        settingsIntro:
            "在原生文件列表中显示时间、笔记属性或自定义备注。插件只读取已有信息，不会修改笔记内容。",
        language: "界面语言",
        languageDesc:
            "控制本插件设置页和提示消息使用的语言。",
        languageAuto: "自动跟随系统",
        languageChinese: "简体中文",
        languageEnglish: "English",
        position: "显示位置",
        positionDesc:
            "自动模式会根据侧边栏宽度和标题长度决定显示位置。",
        positionAuto: "自动判断",
        positionRight: "永远显示在标题右侧",
        positionBelow: "永远显示在标题下方",
        content: "显示内容",
        contentDesc:
            "选择在每篇笔记名称旁显示的信息。",
        contentTime: "文件修改时间",
        contentProperty: "笔记属性值",
        contentText: "自定义文字",
        contentTimeProperty: "修改时间 + 笔记属性值",
        propertyName: "属性名称",
        propertyNameDesc:
            "填写笔记顶部属性区域中的名称。例如属性为 status: 进行中，此处填写 status。",
        propertyNamePlaceholder: "例如：status",
        customText: "自定义文字",
        customTextDesc:
            "可填写固定备注，也可使用 {property}、{date}、{time}、{name} 和 {path}。例如：状态：{property}",
        customTextPlaceholder: "例如：状态：{property}",
        filter: "显示条件",
        filterDesc:
            "可让备注只出现在符合条件的笔记中。",
        filterAlways: "所有笔记",
        filterHasProperty: "包含指定属性的笔记",
        filterEquals: "属性值等于指定文字的笔记",
        filterProperty: "条件属性名称",
        filterPropertyDesc:
            "例如填写 status，插件会根据每篇笔记的 status 属性判断是否显示。",
        filterValue: "条件属性值",
        filterValueDesc:
            "例如条件属性名称填写 status，此处填写 进行中。",
        filterValuePlaceholder: "例如：进行中",
        guideTitle: "常用设置示例",
        guideTime:
            "只显示更新时间：选择“文件修改时间”，位置可选择“自动判断”。",
        guideProperty:
            "显示属性内容：选择“笔记属性值”，再填写属性名称，例如 status。",
        guideCombined:
            "同时显示时间和属性：选择“修改时间 + 笔记属性值”。插件会使用标题下方的两行布局。",
        guideText:
            "自定义备注：选择“自定义文字”。例如填写“状态：{property}”，即可显示属性内容。",
        guidePrivacy:
            "插件读取的是已有文件信息和笔记属性，不会把任何内容写回笔记。",
        noticeCombinedBelow:
            "同时显示时间和属性时，显示位置已调整为标题下方。"
    },
    en: {
        settingsTitle: "File List Details",
        settingsIntro:
            "Show time, note properties, or custom details in the native File Explorer. The plugin only reads existing information and does not modify note content.",
        language: "Interface language",
        languageDesc:
            "Choose the language used for this plugin's settings and notices.",
        languageAuto: "Follow system",
        languageChinese: "Simplified Chinese",
        languageEnglish: "English",
        position: "Display position",
        positionDesc:
            "Automatic mode chooses a position based on sidebar width and title length.",
        positionAuto: "Automatic",
        positionRight: "Always on the right",
        positionBelow: "Always below the title",
        content: "Display content",
        contentDesc:
            "Choose the information shown beside each note title.",
        contentTime: "File modification time",
        contentProperty: "Note property value",
        contentText: "Custom text",
        contentTimeProperty: "Modification time + note property value",
        propertyName: "Property name",
        propertyNameDesc:
            "Enter a property name from the note properties. For status: In progress, enter status.",
        propertyNamePlaceholder: "For example: status",
        customText: "Custom text",
        customTextDesc:
            "Use fixed text or {property}, {date}, {time}, {name}, and {path}. Example: Status: {property}",
        customTextPlaceholder: "Example: Status: {property}",
        filter: "Display condition",
        filterDesc:
            "Limit details to notes that match a condition.",
        filterAlways: "All notes",
        filterHasProperty: "Notes with a property",
        filterEquals: "Notes with a matching property value",
        filterProperty: "Condition property name",
        filterPropertyDesc:
            "For example, enter status to check the status property for each note.",
        filterValue: "Condition property value",
        filterValueDesc:
            "For example, enter In progress when the condition property is status.",
        filterValuePlaceholder: "For example: In progress",
        guideTitle: "Common examples",
        guideTime:
            "Modification time only: choose File modification time and Automatic placement.",
        guideProperty:
            "Property value: choose Note property value, then enter a property name such as status.",
        guideCombined:
            "Time and property together: choose Modification time + note property value. The plugin uses a second line below the title.",
        guideText:
            "Custom detail: choose Custom text. For example, Status: {property} displays the selected property value.",
        guidePrivacy:
            "The plugin reads existing file information and note properties only. It does not write anything back to notes.",
        noticeCombinedBelow:
            "The display position was changed to below the title because time and property are shown together."
    }
};

module.exports = class FileListDetailsPlugin extends Plugin {
    async onload() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );

        this.refreshTimer = null;
        this.rowCache = new WeakMap();

        this.ensureMeasureElements();

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

        this.registerEvent(
            this.app.workspace.on("css-change", () => {
                this.rowCache = new WeakMap();
                this.scheduleRefresh();
            })
        );

        this.rowResizeObserver = new ResizeObserver((entries) => {
            if (this.settings.position !== "auto") {
                return;
            }

            for (const entry of entries) {
                this.updateRowLayout(entry.target);
            }
        });

        this.register(() => {
            this.rowResizeObserver.disconnect();
        });

        this.domObserver = new MutationObserver((mutations) => {
            if (this.hasNewFileRows(mutations)) {
                this.scheduleRefresh();
            }
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

        if (this.measureContainer) {
            this.measureContainer.remove();
            this.measureContainer = null;
            this.measureTitleEl = null;
            this.measureValueEl = null;
        }

        this.rowCache = new WeakMap();

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

        document
            .querySelectorAll("[data-" + OBSERVED_DATA_KEY + "]")
            .forEach((element) => {
                delete element.dataset[OBSERVED_DATA_KEY];
            });
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.refreshFileList();
    }

    getLanguage() {
        if (this.settings.language === "zh") {
            return "zh";
        }

        if (this.settings.language === "en") {
            return "en";
        }

        const configuredLocale =
            this.app.vault &&
            typeof this.app.vault.getConfig === "function"
                ? this.app.vault.getConfig("locale")
                : "";

        const pageLanguage =
            document.documentElement.lang ||
            configuredLocale ||
            navigator.language ||
            "";

        return String(pageLanguage).toLowerCase().startsWith("zh")
            ? "zh"
            : "en";
    }

    t(key) {
        const language = this.getLanguage();
        return TEXT[language][key] || TEXT.en[key] || key;
    }

    hasNewFileRows(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) {
                    continue;
                }

                if (
                    node.matches(".nav-file-title[data-path]") ||
                    node.querySelector(".nav-file-title[data-path]")
                ) {
                    return true;
                }
            }
        }

        return false;
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

            if (!row.dataset[OBSERVED_DATA_KEY]) {
                this.rowResizeObserver.observe(row);
                row.dataset[OBSERVED_DATA_KEY] = "true";
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

        let valueElement = row.querySelector("." + VALUE_CLASS);

        if (!valueElement) {
            valueElement = document.createElement("span");
            valueElement.className = VALUE_CLASS;
            valueElement.setAttribute("aria-hidden", "true");
            row.appendChild(valueElement);
        }

        if (valueElement.textContent !== displayText) {
            valueElement.textContent = displayText;
        }

        if (valueElement.title !== displayText) {
            valueElement.title = displayText;
        }

        row.classList.toggle(
            COMBINED_CLASS,
            this.settings.contentMode === "time-property"
        );

        this.applyPosition(row);
        this.updateRowLayout(row);
    }

    removeValue(row) {
        const valueElement = row.querySelector("." + VALUE_CLASS);

        if (valueElement) {
            valueElement.remove();
        }

        row.classList.remove(BELOW_CLASS);
        row.classList.remove(COMBINED_CLASS);
    }

    applyPosition(row) {
        if (this.settings.position === "below") {
            row.classList.add(BELOW_CLASS);
        } else if (this.settings.position === "right") {
            row.classList.remove(BELOW_CLASS);
        }
    }

    ensureMeasureElements() {
        if (this.measureContainer && this.measureContainer.isConnected) {
            return;
        }

        this.measureContainer = document.createElement("div");
        this.measureContainer.className =
            "tree-item-self nav-file-title file-list-details--measure";
        this.measureContainer.style.cssText =
            "position: fixed; left: -9999px; top: -9999px; visibility: hidden; pointer-events: none; width: max-content; max-width: none;";

        this.measureTitleEl = document.createElement("div");
        this.measureTitleEl.className =
            "tree-item-inner nav-file-title-content";
        this.measureTitleEl.style.cssText =
            "width: max-content; max-width: none; flex: none;";
        this.measureContainer.appendChild(this.measureTitleEl);

        this.measureValueEl = document.createElement("span");
        this.measureValueEl.className = VALUE_CLASS;
        this.measureValueEl.style.cssText =
            "width: max-content; max-width: none; flex: none;";
        this.measureContainer.appendChild(this.measureValueEl);

        document.body.appendChild(this.measureContainer);
    }

    measureText(text, el) {
        this.ensureMeasureElements();
        el.textContent = text;
        return el.getBoundingClientRect().width;
    }

    updateRowLayout(row) {
        if (!row.isConnected) {
            return;
        }

        const valueElement = row.querySelector("." + VALUE_CLASS);

        if (!valueElement) {
            return;
        }

        if (this.settings.position === "right") {
            if (row.classList.contains(BELOW_CLASS)) {
                row.classList.remove(BELOW_CLASS);
            }

            return;
        }

        if (this.settings.position === "below") {
            if (!row.classList.contains(BELOW_CLASS)) {
                row.classList.add(BELOW_CLASS);
            }

            return;
        }

        const titleElement = row.querySelector(
            ".nav-file-title-content"
        );

        if (!titleElement) {
            return;
        }

        const computed = window.getComputedStyle(row);
        const paddingLeft = parseFloat(computed.paddingLeft) || 0;
        const paddingRight = parseFloat(computed.paddingRight) || 0;
        const rowWidth = row.getBoundingClientRect().width;
        const availableWidth = rowWidth - paddingLeft - paddingRight;

        if (availableWidth <= 0) {
            return;
        }

        if (!this.rowCache) {
            this.rowCache = new WeakMap();
        }

        let cache = this.rowCache.get(row);
        if (!cache) {
            cache = {};
            this.rowCache.set(row, cache);
        }

        const titleText = titleElement.textContent || "";
        if (cache.titleText !== titleText) {
            cache.titleText = titleText;
            cache.titleWidth = this.measureText(
                titleText,
                this.measureTitleEl
            );
        }

        const valText = valueElement.textContent || "";
        if (cache.valText !== valText) {
            cache.valText = valText;
            cache.valWidth =
                this.measureText(valText, this.measureValueEl) + 8;
        }

        const tagEl = row.querySelector(".nav-file-tag");
        const tagWidth = tagEl ? tagEl.getBoundingClientRect().width : 0;

        const GAP = 10;
        const requiredWidth =
            cache.titleWidth + cache.valWidth + tagWidth + GAP;
        const isCurrentlyBelow = row.classList.contains(BELOW_CLASS);
        const HYSTERESIS = 12;

        let shouldShowBelow;
        if (isCurrentlyBelow) {
            shouldShowBelow = availableWidth < requiredWidth + HYSTERESIS;
        } else {
            shouldShowBelow = availableWidth < requiredWidth;
        }

        if (isCurrentlyBelow !== shouldShowBelow) {
            row.classList.toggle(BELOW_CLASS, shouldShowBelow);
        }
    }

    getNaturalTitleWidth(titleElement) {
        const text = titleElement ? titleElement.textContent || "" : "";
        return this.measureText(text, this.measureTitleEl);
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

            return property ? time + " · " + property : time;
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
        const plugin = this.plugin;
        const t = (key) => plugin.t(key);

        container.empty();

        container.createEl("h2", {
            text: t("settingsTitle")
        });

        container.createEl("p", {
            text: t("settingsIntro"),
            cls: "file-list-details-help"
        });

        new Setting(container)
            .setName(t("language"))
            .setDesc(t("languageDesc"))
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("auto", t("languageAuto"))
                    .addOption("zh", t("languageChinese"))
                    .addOption("en", t("languageEnglish"))
                    .setValue(plugin.settings.language)
                    .onChange(async (value) => {
                        plugin.settings.language = value;
                        await plugin.saveSettings();
                        this.display();
                    });
            });

        new Setting(container)
            .setName(t("position"))
            .setDesc(t("positionDesc"))
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("auto", t("positionAuto"))
                    .addOption("right", t("positionRight"))
                    .addOption("below", t("positionBelow"))
                    .setValue(plugin.settings.position)
                    .onChange(async (value) => {
                        plugin.settings.position = value;

                        if (
                            plugin.settings.contentMode ===
                                "time-property" &&
                            value !== "below"
                        ) {
                            plugin.settings.position = "below";

                            new Notice(t("noticeCombinedBelow"));
                        }

                        await plugin.saveSettings();
                        this.display();
                    });
            });

        new Setting(container)
            .setName(t("content"))
            .setDesc(t("contentDesc"))
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("time", t("contentTime"))
                    .addOption("property", t("contentProperty"))
                    .addOption("text", t("contentText"))
                    .addOption(
                        "time-property",
                        t("contentTimeProperty")
                    )
                    .setValue(plugin.settings.contentMode)
                    .onChange(async (value) => {
                        plugin.settings.contentMode = value;

                        if (
                            value === "time-property" &&
                            plugin.settings.position !== "below"
                        ) {
                            plugin.settings.position = "below";

                            new Notice(t("noticeCombinedBelow"));
                        }

                        await plugin.saveSettings();
                        this.display();
                    });
            });

        const needsPropertyName =
            plugin.settings.contentMode === "property" ||
            plugin.settings.contentMode === "time-property" ||
            (
                plugin.settings.contentMode === "text" &&
                plugin.settings.customText.includes("{property}")
            );

        if (needsPropertyName) {
            new Setting(container)
                .setName(t("propertyName"))
                .setDesc(t("propertyNameDesc"))
                .addText((text) => {
                    text.setPlaceholder(t("propertyNamePlaceholder"))
                        .setValue(plugin.settings.propertyName)
                        .onChange(async (value) => {
                            plugin.settings.propertyName = value;
                            await plugin.saveSettings();
                        });
                });
        }

        if (plugin.settings.contentMode === "text") {
            new Setting(container)
                .setName(t("customText"))
                .setDesc(t("customTextDesc"))
                .addTextArea((text) => {
                    text.setPlaceholder(t("customTextPlaceholder"))
                        .setValue(plugin.settings.customText)
                        .onChange(async (value) => {
                            plugin.settings.customText = value;
                            await plugin.saveSettings();
                            this.display();
                        });
                });
        }

        new Setting(container)
            .setName(t("filter"))
            .setDesc(t("filterDesc"))
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("always", t("filterAlways"))
                    .addOption("has-property", t("filterHasProperty"))
                    .addOption("equals", t("filterEquals"))
                    .setValue(plugin.settings.filterMode)
                    .onChange(async (value) => {
                        plugin.settings.filterMode = value;
                        await plugin.saveSettings();
                        this.display();
                    });
            });

        if (plugin.settings.filterMode !== "always") {
            new Setting(container)
                .setName(t("filterProperty"))
                .setDesc(t("filterPropertyDesc"))
                .addText((text) => {
                    text.setPlaceholder(t("propertyNamePlaceholder"))
                        .setValue(plugin.settings.filterProperty)
                        .onChange(async (value) => {
                            plugin.settings.filterProperty = value;
                            await plugin.saveSettings();
                        });
                });
        }

        if (plugin.settings.filterMode === "equals") {
            new Setting(container)
                .setName(t("filterValue"))
                .setDesc(t("filterValueDesc"))
                .addText((text) => {
                    text.setPlaceholder(t("filterValuePlaceholder"))
                        .setValue(plugin.settings.filterValue)
                        .onChange(async (value) => {
                            plugin.settings.filterValue = value;
                            await plugin.saveSettings();
                        });
                });
        }

        const guide = container.createDiv({
            cls: "file-list-details-guide"
        });

        guide.createEl("h3", {
            text: t("guideTitle")
        });

        guide.createEl("p", {
            text: t("guideTime")
        });

        guide.createEl("p", {
            text: t("guideProperty")
        });

        guide.createEl("p", {
            text: t("guideCombined")
        });

        guide.createEl("p", {
            text: t("guideText")
        });

        guide.createEl("p", {
            text: t("guidePrivacy")
        });
    }
}
