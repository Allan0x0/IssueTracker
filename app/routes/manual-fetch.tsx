import z from "zod";
import prisma from "~/db.server";
import { getErrorMessage } from "~/utils";
import type { Route } from "./+types/manual-fetch";

const Schema = z.object({
  lastChecked: z.coerce.date(),
});
export async function action ({ request }: Route.ActionArgs) {
  try {
    const json = await request.json();
    const result = Schema.safeParse(json);
    if (!result.success) {
      return { err: z.treeifyError(result.error) }
    }
    const newIssues = await prisma.issue.findMany({
      where: { createdAt: { gte: result.data.lastChecked } },
      include: { issueType: true, user: true },
    });
    return { newIssues };
  } catch (err) {
    return { err: getErrorMessage(err) };
  }
}