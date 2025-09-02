"use server";
import { db } from "~/server/db";

export async function GetProblem(
  year: number,
  level: "InvA" | "InvB" | "District" | "Regional" | "State" | "Custom",
) {
  return await db.query.problems.findFirst({
    with: {
      year: year,
      level: level,
    },
  });
}
