// components/dashboard/CourseResourceCard.tsx

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    ArrowRight,
    ExternalLink,
    Video,
    FileText,
    Gamepad2Icon,
    Coffee,
} from "lucide-react";
import { type ReactNode } from "react";

// Define the props for our component for type safety
export interface CourseResourceCardProps {
    title: string;
    description: string;
    href: string;
    tags: string[];
}

/**
 * A map to associate specific tags with icons and custom styles.
 * This makes the component more dynamic and visually interesting.
 */
const tagStyles: {
    [key: string]: {
        icon: ReactNode;
        className: string;
    };
} = {
    videos: {
        icon: <Video className="h-3 w-3" />,
        className: "border-transparent bg-info/15 text-info hover:bg-info/25",
    },
    assignments: {
        icon: <FileText className="h-3 w-3" />,
        className:
            "border-transparent bg-success/15 text-success hover:bg-success/25",
    },
    multiplayer: {
        icon: <Gamepad2Icon className="h-3 w-3" />,
        className: "border-transparent bg-info/15 text-info hover:bg-info/25",
    },
    java: {
        icon: <Coffee className="h-3 w-3" />,
        className:
            "border-transparent bg-warning/15 text-warning hover:bg-warning/25",
    },
};

/**
 * A card component for displaying an external online course or resource.
 * It includes a title, a custom description, tags, and a direct link.
 */
export function CourseResourceCard({
    title,
    description,
    href,
    tags,
}: CourseResourceCardProps) {
    return (
        <Card className="gap-4 overflow-hidden pb-0 transition-shadow hover:shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg leading-snug">{title}</CardTitle>
            </CardHeader>

            <CardContent className="flex grow flex-col">
                {/* Custom Description */}
                <p className="text-muted-foreground mb-4 text-sm">
                    {description}
                </p>

                {/* Tags / Badges */}
                <div className="mt-auto flex flex-wrap gap-2">
                    {tags.map((tag) => {
                        const style = tagStyles[tag.toLowerCase()];
                        return (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className={`flex items-center gap-1.5 ${style?.className ?? ""}`}
                            >
                                {style?.icon}
                                <span className="font-semibold">{tag}</span>
                            </Badge>
                        );
                    })}
                </div>
            </CardContent>

            {/* Action Button that is a Link */}
            <div className="bg-muted/50 mt-2 border-t p-4">
                <Button asChild className="w-full">
                    {/* Outside sites open in a new tab; this site's pages don't. */}
                    {href.startsWith("/") ? (
                        <Link href={href}>
                            Open
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    ) : (
                        <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Resource
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    )}
                </Button>
            </div>
        </Card>
    );
}
