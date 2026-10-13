# Explorer Details

Explorer Details adds useful metadata to notes in the native File Explorer.

It can show file modification times, note property values, custom text, or a combination of time and property values. The plugin enhances the existing file list and does not create a replacement file browser.

Chinese name: 文件列表备注

## Features

- Show the file modification time for each note.
- Show the value of a note property.
- Show custom text or a reusable note label.
- Show modification time and a property value together.
- Place details automatically, always on the right, or always below the note title.
- Move details below long note titles when the sidebar is too narrow.
- Filter details by property presence or property value.
- Use note name, file path, property, date, and time placeholders in custom text.
- Keep all note content and properties unchanged.

## Privacy

Explorer Details does not send network requests, collect telemetry, display advertisements, or require an account.

The plugin only reads existing file metadata and note properties from the current vault. It does not modify note content, frontmatter, or Properties.

## Installation

### Community Plugins

After the plugin is available in the Community Plugins directory:

1. Open Settings.
2. Open Community plugins.
3. Search for Explorer Details.
4. Select Install.
5. Enable the plugin after installation.

### Manual Installation

1. Open the latest release on the GitHub Releases page.
2. Download these three files:

   ```text
   main.js
   manifest.json
   styles.css
   ```

3. Create this folder inside the vault:

   ```text
   .obsidian/plugins/file-list-details
   ```

4. Put the three downloaded files directly into that folder.
5. Restart the application, or reload community plugins.
6. Enable Explorer Details in Settings > Community plugins.

## Usage

Open Settings > Explorer Details.

### Show Modification Time

Choose:

```text
Display content: File modification time
Display position: Automatic
```

The time appears on the right when enough space is available. It moves below the note title when the file list is narrow or the note title is long.

### Show a Note Property

For a note with this property:

```yaml
---
status: In progress
---
```

Choose:

```text
Display content: Note property value
Property name: status
```

The file list displays:

```text
In progress
```

### Show Time and Property Together

Choose:

```text
Display content: Modification time + note property value
Property name: status
Display position: Always below the title
```

Example result:

```text
Project plan
10-13 20:45 · In progress
```

### Use Custom Text

Choose Custom text and enter a template such as:

```text
Status: {property}
```

Available placeholders:

| Placeholder | Result |
| --- | --- |
| `{name}` | Note name without the `.md` extension |
| `{path}` | File path inside the vault |
| `{property}` | Value of the configured property |
| `{date}` | File modification date |
| `{time}` | File modification time |

Example template:

```text
{name} · {date} {time}
```

### Filter Notes

Use Display condition to limit details to matching notes.

For example, to show details only for notes where `status` is `In progress`:

```text
Display condition: Property value equals specified text
Condition property name: status
Condition property value: In progress
```

## Compatibility

- Tested with version 1.13.7.
- The plugin uses the native File Explorer structure.
- Future application updates may require compatibility updates if the internal file list structure changes.

## Support

Please open a GitHub issue with the application version, plugin version, current settings, and steps to reproduce the problem.

## License

This project is released under the MIT License.
