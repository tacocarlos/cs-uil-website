"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
    Maximize2,
    Minimize2,
    PanelBottomClose,
    PanelBottomOpen,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useIsMobileOrUnknown } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";

/**
 * Two resizable columns: problem info on the left, editor on the right. On
 * phones the columns become full-screen tabs, problem first.
 */
export function ProblemWorkspace({
    sidebar,
    children,
}: {
    sidebar: ReactNode;
    children: ReactNode;
}) {
    const isMobile = useIsMobileOrUnknown();

    // Wait for the measurement: rendering one layout and then the other
    // would remount Monaco (and reconnect the LSP).
    if (isMobile === undefined) return null;

    if (isMobile) {
        // forceMount keeps both tabs mounted, so Monaco survives tab switches.
        const pane = "min-h-0 flex-1 data-[state=inactive]:hidden";
        return (
            <Tabs defaultValue="problem" className="h-full w-full gap-0">
                <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="problem">Problem</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                <TabsContent value="problem" forceMount className={pane}>
                    {sidebar}
                </TabsContent>
                <TabsContent value="code" forceMount className={pane}>
                    {children}
                </TabsContent>
            </Tabs>
        );
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={40} minSize={30}>
                {sidebar}
            </ResizablePanel>
            <ResizableHandle className="bg-border hover:bg-ring w-1" />
            <ResizablePanel defaultSize={60} minSize={40}>
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}

export type SidebarTab = {
    value: string;
    label: string;
    content: ReactNode;
    className?: string;
};

/** Tabbed left column. The first tab is selected by default. */
export function ProblemSidebar({ tabs }: { tabs: SidebarTab[] }) {
    return (
        <div className="bg-background flex h-full flex-col">
            <Tabs
                defaultValue={tabs[0]?.value}
                className="flex h-full flex-col"
            >
                <TabsList className="bg-background w-full justify-start rounded-none border-b px-4">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="data-[state=active]:border-b-info data-[state=active]:border-b-2 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                            "mt-0 flex-1 overflow-y-auto p-6",
                            tab.className,
                        )}
                    >
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

/**
 * Right column: toolbar, editor above I/O (vertically resizable), footer.
 *
 * The I/O panel can be hidden, and "full screen" lays the pane over the whole
 * viewport (covering the navbar and problem column) with I/O hidden. Hidden
 * I/O comes back on its own when a run produces output.
 */
export function EditorPane({
    toolbar,
    editor,
    io,
    footer,
    outputVersion,
}: {
    toolbar: ReactNode;
    editor: ReactNode;
    io: ReactNode;
    footer: ReactNode;
    /** Changes whenever new output arrives; reveals a hidden I/O panel. */
    outputVersion?: number;
}) {
    const ioPanel = useRef<ImperativePanelHandle>(null);
    const [ioHidden, setIoHidden] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    // Whether I/O was hidden before entering full screen, to restore on exit.
    const ioHiddenBefore = useRef(false);

    function setIoVisible(visible: boolean) {
        if (visible) ioPanel.current?.expand();
        else ioPanel.current?.collapse();
    }

    function toggleFullscreen() {
        if (fullscreen) {
            setIoVisible(!ioHiddenBefore.current);
        } else {
            ioHiddenBefore.current = ioHidden;
            setIoVisible(false);
        }
        setFullscreen(!fullscreen);
    }

    useEffect(() => {
        if (outputVersion) ioPanel.current?.expand();
    }, [outputVersion]);

    return (
        <div
            className={cn(
                "bg-background flex h-full flex-col",
                // z-50 matches the navbar and comes later in the DOM, so it
                // covers it; portaled menus and dialogs (also z-50, appended
                // to <body>) still show on top.
                fullscreen && "fixed inset-0 z-50 h-dvh",
            )}
        >
            <div className="bg-card flex items-center gap-2 border-b px-4 py-2">
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                    {toolbar}
                </div>
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIoVisible(ioHidden)}
                        title={ioHidden ? "Show I/O panel" : "Hide I/O panel"}
                        aria-label={
                            ioHidden ? "Show I/O panel" : "Hide I/O panel"
                        }
                    >
                        {ioHidden ? <PanelBottomOpen /> : <PanelBottomClose />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        title={fullscreen ? "Exit full screen" : "Full screen"}
                        aria-label={
                            fullscreen ? "Exit full screen" : "Full screen"
                        }
                        aria-pressed={fullscreen}
                    >
                        {fullscreen ? <Minimize2 /> : <Maximize2 />}
                    </Button>
                </div>
            </div>
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={30}>
                    {editor}
                </ResizablePanel>
                <ResizableHandle className="bg-border hover:bg-ring h-1" />
                <ResizablePanel
                    ref={ioPanel}
                    defaultSize={30}
                    minSize={20}
                    collapsible
                    collapsedSize={0}
                    onCollapse={() => setIoHidden(true)}
                    onExpand={() => setIoHidden(false)}
                >
                    {io}
                </ResizablePanel>
            </ResizablePanelGroup>
            <div className="bg-card flex items-center justify-between border-t px-4 py-3">
                {footer}
            </div>
        </div>
    );
}
