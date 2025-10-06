"use client";

import React, { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import "~/styles/globals.css";
import {
    Background,
    Controls,
    type Edge,
    Handle,
    MarkerType,
    MiniMap,
    type Node,
    type NodeProps,
    Position,
    ReactFlow,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { PREREQS, TOPICS, type Topic } from "./dataset";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
} from "~/components/ui/drawer";
import { DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const NODE_W = 240;
const NODE_H = 84;

// Simple color per unit for visual grouping
function colorForUnit(unit: number) {
    const colors = [
        "#bfdbfe", // 1
        "#fde68a", // 2
        "#a7f3d0", // 3
        "#fecaca", // 4
        "#ddd6fe", // 5
        "#fbcfe8", // 6
        "#c7d2fe", // 7
        "#fcd34d", // 8
        "#93c5fd", // 9
        "#86efac", // 10
    ];
    return colors[(unit - 1) % colors.length]!;
}

type TopicNode = Node<{ topic: Topic }, "topic">;

function TopicNode({ data }: NodeProps<TopicNode>) {
    const { topic } = data;
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={true}
            />
            <div
                style={{
                    width: NODE_W,
                    height: NODE_H,
                    boxSizing: "content-box",
                    padding: 5,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: colorForUnit(topic.unit),
                    color: "#111827",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
                title={topic.desc}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {topic.label}
                    </div>
                    <span
                        style={{
                            fontSize: 12,
                            background: "rgba(17,24,39,0.1)",
                            color: "#111827",
                            padding: "2px 8px",
                            borderRadius: 999,
                            lineHeight: 1.4,
                        }}
                    >
                        U{topic.unit}
                    </span>
                </div>
                {topic.desc && (
                    <div
                        style={{
                            fontSize: 12,
                            color: "#374151",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                        }}
                    >
                        {topic.desc}
                    </div>
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={true}
            />
        </>
    );
}

const nodeTypes = { topic: TopicNode };

function layoutDagre(
    nodes: TopicNode[],
    edges: Edge[],
    dir: "LR" | "TB" = "LR",
) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: dir,
        nodesep: 40,
        ranksep: 100,
        marginx: 20,
        marginy: 20,
    });

    nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);

    const isLR = dir === "LR";
    const laidOutNodes = nodes.map((n) => {
        const pos = g.node(n.id);
        return {
            ...n,
            position: {
                x: pos.x - NODE_W / 2,
                y: pos.y - NODE_H / 2,
            },
            targetPosition: isLR ? Position.Left : Position.Top,
            sourcePosition: isLR ? Position.Right : Position.Bottom,
        };
    });

    return { nodes: laidOutNodes, edges };
}

export default function StaticSkillTree({
    direction = "LR",
}: {
    direction?: "LR" | "TB";
}) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            alert(
                "This page is currently a work in progress. Currently shows old AP CSA Topics, will update later to be CS UIL specific.",
            );
        }
    }, []);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(TOPICS.at(0)!);
    const baseNodes: TopicNode[] = React.useMemo(
        () =>
            TOPICS.map((t) => ({
                id: t.id,
                type: "topic",
                data: { topic: t },
                position: { x: 0, y: 0 },
            })),
        [],
    );

    const baseEdges: Edge[] = React.useMemo(
        () =>
            PREREQS.map((e) => ({
                id: `e-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
                type: "smoothstep",
                animated: false,
                style: { stroke: "#9ca3af" },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 18,
                    height: 18,
                    color: "#9ca3af",
                },
            })),
        [],
    );

    const { nodes, edges } = React.useMemo(
        () => layoutDagre(baseNodes, baseEdges, direction),
        [baseNodes, baseEdges, direction],
    );
    console.dir(edges);

    return (
        <div
            style={{
                width: "100%",
                height: "80vh",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                zoomOnPinch
                onNodeClick={(event: React.MouseEvent, node: TopicNode) => {
                    setSelectedTopic(node.data.topic);
                    setDrawerOpen(true);
                }}
                colorMode="dark"
            >
                <MiniMap<TopicNode>
                    nodeColor={(node: TopicNode) => {
                        const topic = node.data.topic;
                        return colorForUnit(topic.unit);
                    }}
                />
                <Controls />
                <Background gap={16} />
            </ReactFlow>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerHeader>
                    <DialogTitle>Title</DialogTitle>
                    <DrawerDescription>Description</DrawerDescription>
                </DrawerHeader>
                <DrawerContent>
                    <Card className="mx-6">
                        <CardHeader>
                            <CardTitle>{selectedTopic.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>{selectedTopic.desc}</div>
                        </CardContent>
                    </Card>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button>Ok</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
