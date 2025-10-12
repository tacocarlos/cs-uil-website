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
import type { Topic, Prereq } from "../../../app/resources/skill-tree/topic";
import { Lock } from "lucide-react";

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
    return colors[unit % colors.length]!;
}

type TopicNode = Node<{ topic: Topic; topicIndex: number }, "topic">;
type TopicStatus = "unlocked" | "completed" | "locked";
function determineStatus(topic: Topic): TopicStatus {
    if (topic.completed === true) return "completed";
    if (topic.unlocked === true) return "unlocked";

    return "locked";
}

function TopicNode({ data }: NodeProps<TopicNode>) {
    const { topic, topicIndex } = data;
    // lacking colors
    const basicStyle = {
        width: NODE_W,
        height: NODE_H,
        boxSizing: "content-box",
        padding: 5,
        borderRadius: 10,
        border: "1px solid #d1d5db",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        color: "#111827",
    } as const;
    function determineStyle() {
        if (topic.completed === true) {
            return { background: colorForUnit(topicIndex) };
        } else if (topic.unlocked === true) {
            return { background: "#ffffff", color: "#000000" };
        }

        return { background: "#000000", fontSize: 0, color: "#ffffff" };
    }

    const topicStatus = determineStatus(topic);

    const { color, background } = determineStyle();
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={true}
            />
            <div
                style={{
                    ...basicStyle,
                    color,
                    background,
                }}
                title={topic.desc}
            >
                {topicStatus === "locked" ? (
                    <Lock className="absolute h-full w-full pb-4" />
                ) : null}
                <div
                    className={
                        topic.unlocked === true
                            ? "animate-background bg-gradient-to-r from-green-300 via-blue-600 to-red-300 bg-[length:_400%_400%] p-1 ease-in-out [animation-duration:_4s]"
                            : ""
                    }
                >
                    <div
                        className={`flex items-center justify-between gap-8`}
                        style={{ background }}
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
                    </div>
                    {topic.id.startsWith("u") ? (
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
                            {topic.id.toLocaleUpperCase()}
                        </span>
                    ) : null}
                </div>
                {topic.desc && (
                    <div
                        style={{
                            fontSize: topicStatus !== "locked" ? 12 : 0,
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
    topicData,
    preReqData,
}: {
    direction?: "LR" | "TB";
    topicData: Topic[];
    preReqData: Prereq[];
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(topicData.at(0)!);
    const baseNodes: TopicNode[] = React.useMemo(
        () =>
            topicData.map((t, idx) => ({
                id: t.id,
                type: "topic",
                data: { topic: t, topicIndex: idx },
                position: { x: 0, y: 0 },
            })),
        [topicData],
    );

    const baseEdges: Edge[] = React.useMemo(
        () =>
            preReqData.map((e) => ({
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
        [preReqData],
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
                    if (determineStatus(node.data.topic) === "locked") {
                        return;
                    }

                    setSelectedTopic(node.data.topic);
                    setDrawerOpen(true);
                }}
                colorMode="dark"
            >
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
                            <ul>
                                {selectedTopic.relevantLinks.map((rl, idx) => {
                                    return (
                                        <li key={idx}>
                                            <a href={rl}>{rl}</a>
                                        </li>
                                    );
                                })}
                            </ul>
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
