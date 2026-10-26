import { type featureRequest } from "~/server/db/schema/feature-request";

type FeatureRequest = typeof featureRequest.$inferSelect;
export type FeatureRequestCategory = FeatureRequest["category"];
export type FeatureRequestStatus = FeatureRequest["featureStatus"];

export const CATEGORY_LABELS: Record<FeatureRequestCategory, string> = {
    problem: "Problem feature",
    contest: "Contest feature",
    bug: "Bug",
    other: "Other",
};

export const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    implemented: "Implemented",
    denied: "Denied",
};

export const STATUS_BADGE_VARIANTS: Record<
    FeatureRequestStatus,
    "default" | "secondary" | "destructive" | "outline"
> = {
    pending: "outline",
    accepted: "secondary",
    implemented: "default",
    denied: "destructive",
};
