import { useEffect } from "react";
import { redirect, useFetcher, useLoaderData } from "react-router";
import z from "zod";
import { Button } from "~/components/Button";
import { Select, TextArea } from "~/components/Input";
import prisma from "~/db.server";
import { IssueStatus } from "~/issues";
import { AppLinks } from "~/links";
import { requireUserId } from "~/sessions.server";
import { getErrorMessage, hasErr, hasSuccess } from "~/utils";
import { getRawFormFields } from "~/utils.server";
import type { Route } from "./+types/client.send-issue";

export async function loader(_: Route.LoaderArgs) {
  const issueTypes = await prisma.issueType.findMany();
  return { issueTypes };
}

const Schema = z.object({
  issueTypeId: z.coerce.number().int().min(0),
  description: z.string().min(3),
});
export async function action({ request }: Route.ActionArgs) {
  const currentUserId = await requireUserId(request);
  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return { err: result.error.message };
    }
    const { issueTypeId, description } = result.data;

    await prisma.issue.create({
      data: {
        userId: currentUserId,
        issueTypeId,
        description,
        status: IssueStatus.Pending,
      }
    });

    return redirect(AppLinks.Client.Index);
  } catch (err) {
    return { err: getErrorMessage(err) };
  }
}

export default function SendIssuePage() {
  const { issueTypes } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';

  useEffect(() => {
    if (hasErr(fetcher.data)) {
      window.alert("Error: " + fetcher.data.err);
    }
    if (hasSuccess(fetcher.data)) {
      window.alert("Sent issue successfully!");
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-col items-start">
      <h1 className="text-xl font-semibold">Employee - Send Issue</h1>
      <fetcher.Form method="post" className="flex flex-col items-stretch py-16 gap-2 w-full md:w-auto md:max-w-4xl md:min-w-2xl">
        <Select name="issueTypeId" label="Select Type of Issue" required>
          <option value="">-- Select Type of Issue --</option>
          {issueTypes.map(i => (
            <option value={i.id}>{i.identifier}</option>
          ))}
        </Select>
        <TextArea name="description" label="Description" placeholder="Describe your issue...." required />
        <div className="flex flex-col items-stretch py-6">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  )
}