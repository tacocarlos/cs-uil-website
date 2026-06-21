// components/dashboard/CourseResourceCard.tsx

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    ExternalLink,
    Video,
    FileText,
    Gamepad,
    Gamepad2,
    GamepadIcon,
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

const TagClass = (color: string) =>
    `border-transparent bg-${color}-100 text-${color}-800 hover:bg-${color}-200`;

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
        className:
            "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    assignments: {
        icon: <FileText className="h-3 w-3" />,
        className:
            "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
    },
    multiplayer: {
        icon: <Gamepad2Icon className="h-3 w-3" />,
        className:
            "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    Java: {
        icon: <Coffee className="h-3 w-3" />,
        className: TagClass("red"),
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
        <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
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
            <div className="border-t bg-slate-50 p-4 dark:bg-slate-800/50">
                <Button asChild className="w-full">
                    <Link href={href} target="_blank" rel="noopener noreferrer">
                        View Resource
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
