import prisma from "~/db.server"
import type { Route } from "./+types/admin"
import { useFetcher, useLoaderData } from "react-router";
import { IssueStatus } from "~/issues";
import { useEffect, useState, type ComponentProps } from "react";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import { getRawFormFields } from "~/utils.server";
import z from "zod";
import { hasErr, hasSuccess } from "~/utils";
import { Button } from "~/components/Button";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || "";

  const result = z.string().trim().max(50).safeParse(search);
  const safeSearch = result.success ? result.data : "";

  const [issues, issueTypes] = await Promise.all([
    prisma.issue.findMany({
      where: { description: { contains: safeSearch } },
      include: { issueType: true, user: true },
    }),
    prisma.issueType.findMany(),
  ]);
  interface IssueTypeData {
    id: number;
    type: string;
    amount: number
  }
  const issueTypeData: IssueTypeData[] = issueTypes.map(i => ({
    id: i.id,
    type: i.identifier,
    amount: 0
  }));
  for (let issue of issues) {
    const match = issueTypeData.find(i => i.id === issue.issueTypeId);
    if (match) {
      const index = issueTypeData.indexOf(match);
      const current = issueTypeData[index];
      issueTypeData[index] = {
        ...current,
        amount: current.amount + 1
      }
    } else {
      issueTypeData.push({
        id: issue.issueTypeId,
        type: issue.issueType.identifier,
        amount: 1,
      });
    }
  }

  const numPending = issues.filter(i => i.status === IssueStatus.Pending).length;
  const numResolved = issues.filter(i => i.status === IssueStatus.Resolved).length;

  return { issues, issueTypeData, numPending, numResolved }
}

const Schema = z.object({
  id: z.coerce.number().min(0)
});
export async function action({ request }: Route.ActionArgs) {
  const fields = await getRawFormFields(request);
  const result = Schema.safeParse(fields);
  if (!result.success) {
    return { err: result.error.message };
  }
  await prisma.issue.update({
    where: { id: result.data.id },
    data: { status: IssueStatus.Resolved }
  });
  return { success: true }
}

export default function DashboardIndex() {
  const { issues, issueTypeData, numPending, numResolved } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof loader>();

  const finalIssues = (fetcher.data?.issues || issues).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const [lastChecked, setLastChecked] = useState(new Date());

  const [effIssues, setEffIssues] = useState(finalIssues.map(i => ({
    ...i,
    new: false
  })));

  useEffect(() => {
    if (fetcher.data?.issues) {
      setEffIssues(fetcher.data.issues.map(i => ({ ...i, new: false })));
    }
  }, [fetcher.data?.issues]);

  useEffect(() => {
    async function init() {
      try {
        const r = await fetch("/manual-fetch", {
          method: "post",
          body: JSON.stringify({ lastChecked })
        }).then(r => r.json());

        if (hasErr(r)) {
          window.alert("Error: " + r.err);
        }
        console.log("r", r);
        if (r.newIssues.length) {
          setEffIssues(prev => [
            ...r.newIssues.map((i: any) => ({
              ...i,
              new: true,
            })),
            ...prev,
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLastChecked(new Date());
      }
    }
    const t = setTimeout(() => {
      console.log("Checking...");
      init();
    }, 1000 * 20);
    return () => clearTimeout(t);
  }, [lastChecked]);

  return (
    <div className="flex flex-col items-stretch">
      <h1 className="text-xl font-semibold">Admin - Dashboard</h1>
      <div className="flex flex-col items-stretch py-16 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {issueTypeData.map(issueType => (
            <StatCard key={issueType.id} label={issueType.type} value={issueType.amount} />
          ))}
          <StatCard label="Total Pending" value={numPending} labelClassName="text-orange-600" />
          <StatCard label="Total Resolved" value={numResolved} labelClassName="text-green-600" />
        </div>
        <div className="flex flex-col items-stretch py-4 gap-2">
          <fetcher.Form method="get" className="flex flex-row items-center gap-2">
            <span className="font-semibold text-lg">Issues</span>
            <div className='grow' />
            <input type="search" name="search" placeholder="Search" className="border border-stone-400 rounded-md px-4 py-2" />
            <Button type="submit">Search</Button>
          </fetcher.Form>
          <table>
            <thead>
              <tr>
                <Th>Date & Time</Th>
                <Th>User</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {effIssues.map(issue => (
                <IssueItem key={issue.id} {...issue} new={issue.new} />
              ))}
              {!effIssues.length && (
                <tr>
                  <Td colSpan={5}>No issues found</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface IssueItemProps {
  id: number;
  createdAt: Date;
  user: { username: string };
  issueType: { identifier: string };
  description: string;
  status: string;
  new?: boolean;
}
export function IssueItem(issue: IssueItemProps) {
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';

  useEffect(() => {
    if (hasSuccess(fetcher.data)) {
      window.alert("Issue marked as resolved!");
    }
    if (hasErr(fetcher.data)) {
      window.alert("Error: " + fetcher.data.err);
    }
  }, [fetcher.data]);

  return (
    <tr key={issue.id} className={twMerge(issue.new && "bg-green-50")}>
      <Td>{dayjs(issue.createdAt).format("YYYY/MM/DD HH:mm")}</Td>
      <Td>{issue.user.username}</Td>
      <Td>{issue.issueType.identifier}</Td>
      <Td width="40%">
        <div className="flex flex-row items-center gap-2">
          <span>{issue.description}</span>
          {issue.new && (
            <div className="flex flex-col justify-center items-center rounded-full px-4 py-1 bg-green-400 text-white text-sm">
              New
            </div>
          )}
        </div>
      </Td>
      <Td>
        <span className={twMerge("text-orange-400", issue.status === IssueStatus.Resolved && "text-green-600")}>
          {issue.status}
        </span>
        {issue.status === IssueStatus.Pending && (
          <fetcher.Form method="post">
            <input type='hidden' name='id' value={issue.id} />
            <button type="submit" className="underline text-blue-600 cursor-pointer">
              {isProcessing ? 'Updating...' : 'Mark as resolved'}
            </button>
          </fetcher.Form>
        )}
      </Td>
    </tr>
  )
}

interface StatCardProps {
  label: string;
  labelClassName?: string;
  value: number;
}
function StatCard(props: StatCardProps) {
  const { label, value } = props;
  return (
    <div className="flex flex-col items-start border border-stone-200 rounded-xl p-6">
      <span className="text-lg font-semibold">{value}</span>
      <span className={twMerge("text-sm text-stone-600 font-light", props.labelClassName)}>{label} issues</span>
    </div>
  )
}

interface ThProps extends ComponentProps<'th'> { }
export function Th(props: ThProps) {
  const { children, ...rest } = props;
  return (
    <th className="bg-stone-100 text-left text-sm font-semibold border border-stone-200 px-4 py-2" {...rest}>{children}</th>
  )
}

interface TdProps extends ComponentProps<'td'> { }
export function Td(props: TdProps) {
  const { children, ...rest } = props;
  return (
    <td className="text-sm font-light border border-stone-200 px-4 py-2" {...rest}>{children}</td>
  )
}