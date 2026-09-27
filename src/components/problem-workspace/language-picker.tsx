import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";
import {
    groupLanguages,
    searchKeywords,
    type LanguageFilter,
} from "./languages";
import { LspSupportedBadge } from "./lsp/lsp-badges";
import type { CodeEditorState } from "./use-code-editor";

/**
 * Searchable language picker. Type to fuzzy-search (aliases like "cpp" and
 * "py" work), filter to LSP-supported languages, and pick with the keyboard
 * or mouse.
 */
export function LanguagePicker({ editor }: { editor: CodeEditorState }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<LanguageFilter>("all");

    const groups = groupLanguages(editor.languages, filter);
    const lspCount = editor.languages.filter((l) => l.hasLsp).length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Language"
                    disabled={!editor.isReady}
                    className="w-56 justify-between border-slate-600 bg-slate-700 text-sm font-normal text-slate-300 hover:bg-slate-600 hover:text-white"
                >
                    <span className="truncate">{editor.language.name}</span>
                    <ChevronsUpDownIcon className="size-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search languages…" />
                    {/* Pointless when every language already has LSP. */}
                    {lspCount < editor.languages.length && (
                        <div className="border-b p-2">
                            <ToggleGroup
                                type="single"
                                size="sm"
                                variant="outline"
                                value={filter}
                                // Radix allows deselecting; keep one selected.
                                onValueChange={(v) =>
                                    v && setFilter(v as LanguageFilter)
                                }
                                className="w-full"
                                aria-label="Filter languages"
                            >
                                <ToggleGroupItem
                                    value="all"
                                    className="text-xs"
                                >
                                    All ({editor.languages.length})
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="lsp"
                                    className="text-xs"
                                >
                                    LSP supported ({lspCount})
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    )}
                    <CommandList className="max-h-72">
                        <CommandEmpty>No languages found.</CommandEmpty>
                        {groups.map((group) => (
                            <CommandGroup
                                key={group.heading}
                                heading={group.heading}
                            >
                                {group.languages.map((lang) => (
                                    <CommandItem
                                        key={lang.id}
                                        value={lang.name}
                                        keywords={searchKeywords(lang)}
                                        onSelect={() => {
                                            editor.changeLanguage(lang.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <CheckIcon
                                            className={cn(
                                                "size-4",
                                                lang.id === editor.language.id
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                        <span className="truncate">
                                            {lang.name}
                                        </span>
                                        {lang.hasLsp && (
                                            <span className="ml-auto">
                                                <LspSupportedBadge />
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
