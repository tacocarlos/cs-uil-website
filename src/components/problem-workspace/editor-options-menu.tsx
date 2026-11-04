import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { TAB_SIZES } from "./editor-options";
import { EDITOR_THEMES } from "./editor-themes";
import type { CodeEditorState } from "./use-code-editor";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 50;

/** Toolbar menu for theme, font size, formatting, and indentation. */
export function EditorOptionsMenu({ editor }: { editor: CodeEditorState }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    aria-label="Editor options"
                    className="border-slate-600 bg-slate-700 text-sm text-white hover:bg-slate-600 hover:text-white"
                >
                    <SlidersHorizontalIcon className="size-4" />
                    <span className="hidden sm:inline">Editor Options</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4">
                <ThemeField editor={editor} />
                <Separator />
                <FontSizeField editor={editor} />
                <Separator />
                <IndentationFields editor={editor} />
                {editor.formatter !== "none" && (
                    <>
                        <Separator />
                        <FormatSection editor={editor} />
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

const THEME_GROUPS = [
    { label: "Dark", themes: EDITOR_THEMES.filter((t) => t.kind === "dark") },
    { label: "Light", themes: EDITOR_THEMES.filter((t) => t.kind === "light") },
];

function ThemeField({ editor }: { editor: CodeEditorState }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="editor-theme">Theme</Label>
            <Select value={editor.theme.id} onValueChange={editor.setThemeId}>
                <SelectTrigger id="editor-theme" className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {THEME_GROUPS.map((group) => (
                        <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.themes.map((theme) => (
                                <SelectItem key={theme.id} value={theme.id}>
                                    <span
                                        aria-hidden
                                        className="size-3 rounded-full border"
                                        style={{
                                            backgroundColor: theme.background,
                                        }}
                                    />
                                    {theme.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function FontSizeField({ editor }: { editor: CodeEditorState }) {
    const { fontSize } = editor.options;
    const { setFontSize } = editor.setOptions;
    // What's typed, which may be mid-edit (e.g. "1" on the way to "12"), so
    // only valid sizes are applied.
    const [draft, setDraft] = useState(String(fontSize));
    useEffect(() => setDraft(String(fontSize)), [fontSize]);

    const step = (delta: number) =>
        setFontSize(
            Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize + delta)),
        );

    return (
        <div className="space-y-2">
            <Label htmlFor="editor-font-size">Font size</Label>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Decrease font size"
                    disabled={fontSize <= MIN_FONT_SIZE}
                    onClick={() => step(-1)}
                >
                    <MinusIcon />
                </Button>
                <Input
                    id="editor-font-size"
                    type="number"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    step={1}
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const size = Number(e.target.value);
                        if (
                            Number.isInteger(size) &&
                            size >= MIN_FONT_SIZE &&
                            size <= MAX_FONT_SIZE
                        ) {
                            setFontSize(size);
                        }
                    }}
                    onBlur={() => setDraft(String(fontSize))}
                    className="text-center"
                />
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Increase font size"
                    disabled={fontSize >= MAX_FONT_SIZE}
                    onClick={() => step(1)}
                >
                    <PlusIcon />
                </Button>
            </div>
        </div>
    );
}

function IndentationFields({ editor }: { editor: CodeEditorState }) {
    const { tabSize, insertSpaces } = editor.options;
    const { setTabSize, setInsertSpaces } = editor.setOptions;
    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label id="editor-indent-style">Indent with</Label>
                <ToggleGroup
                    type="single"
                    size="sm"
                    variant="outline"
                    value={insertSpaces ? "spaces" : "tabs"}
                    // Radix allows deselecting; keep one selected.
                    onValueChange={(v) => v && setInsertSpaces(v === "spaces")}
                    className="w-full"
                    aria-labelledby="editor-indent-style"
                >
                    <ToggleGroupItem value="spaces">Spaces</ToggleGroupItem>
                    <ToggleGroupItem value="tabs">Tabs</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div className="space-y-2">
                <Label id="editor-indent-size">
                    {insertSpaces ? "Spaces per indent" : "Tab width"}
                </Label>
                <ToggleGroup
                    type="single"
                    size="sm"
                    variant="outline"
                    value={String(tabSize)}
                    onValueChange={(v) => v && setTabSize(Number(v))}
                    className="w-full"
                    aria-labelledby="editor-indent-size"
                >
                    {TAB_SIZES.map((size) => (
                        <ToggleGroupItem key={size} value={String(size)}>
                            {size}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
        </div>
    );
}

function FormatSection({ editor }: { editor: CodeEditorState }) {
    const ready = editor.formatter === "ready";
    return (
        <div className="space-y-2">
            <Button
                className="w-full"
                disabled={!ready}
                onClick={editor.formatCode}
            >
                Format Code
            </Button>
            <p className="text-muted-foreground text-xs">
                {ready ? (
                    <>
                        Uses the indentation above. Shortcut:{" "}
                        <kbd className="font-mono">Shift+Alt+F</kbd>
                    </>
                ) : (
                    "Available once code intelligence is on."
                )}
            </p>
        </div>
    );
}
