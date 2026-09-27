import type { ReactNode } from "react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

/** Two resizable columns: problem info on the left, editor on the right. */
export function ProblemWorkspace({
    sidebar,
    children,
}: {
    sidebar: ReactNode;
    children: ReactNode;
}) {
    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={40} minSize={30}>
                {sidebar}
            </ResizablePanel>
            <ResizableHandle className="w-1 bg-slate-300 hover:bg-slate-400" />
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
        <div className="flex h-full flex-col bg-white">
            <Tabs
                defaultValue={tabs[0]?.value}
                className="flex h-full flex-col"
            >
                <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
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

/** Right column: toolbar, editor above I/O (vertically resizable), footer. */
export function EditorPane({
    toolbar,
    editor,
    io,
    footer,
}: {
    toolbar: ReactNode;
    editor: ReactNode;
    io: ReactNode;
    footer: ReactNode;
}) {
    return (
        <div className="flex h-full flex-col bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
                {toolbar}
            </div>
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={30}>
                    {editor}
                </ResizablePanel>
                <ResizableHandle className="h-1 bg-slate-700 hover:bg-slate-600" />
                <ResizablePanel defaultSize={30} minSize={20}>
                    {io}
                </ResizablePanel>
            </ResizablePanelGroup>
            <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800 px-4 py-3">
                {footer}
            </div>
        </div>
    );
}
