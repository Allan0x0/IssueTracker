import dayjs from "dayjs";
import { type ComponentProps } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { twMerge } from "tailwind-merge";
import z from "zod";
import { Button } from "~/components/Button";
import prisma from "~/db.server";
import { IssueStatus } from "~/issues";
import { requireUserId } from "~/sessions.server";
import type { Route } from "./+types/admin";
import { useUser } from "~/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const currentUserId = await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || "";

  const result = z.string().trim().max(50).safeParse(search);
  const safeSearch = result.success ? result.data : "";

  const issues = await prisma.issue.findMany({
    where: {
      userId: currentUserId,
      description: { contains: safeSearch }
    },
    include: { issueType: true, user: true },
  });

  const numPending = issues.filter(i => i.status === IssueStatus.Pending).length;
  const numResolved = issues.filter(i => i.status === IssueStatus.Resolved).length;

  return { issues, numPending, numResolved }
}

export default function ClientIndex() {
  const currentUser = useUser();
  const { issues, numPending, numResolved } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof loader>();
  const finalIssues = (fetcher.data?.issues || issues).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const fullName = [currentUser.firstName, currentUser.lastName].join(" ");

  return (
    <div className="flex flex-col items-stretch">
      <div className="flex flex-row items-center gap-2">
        <h1 className="text-xl font-semibold">Employee - Dashboard</h1>
        <div className='grow' />
        <span className="text-xl text-stone-400 font-semibold">{fullName}</span>
      </div>
      <div className="flex flex-col items-stretch py-16 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Pending" value={numPending} labelClassName="text-orange-600" />
          <StatCard label="Total Resolved" value={numResolved} labelClassName="text-green-600" />
        </div>
        <div className="flex flex-col items-stretch py-4 gap-2">
          <fetcher.Form method="get" className="flex flex-row items-center gap-2">
            <span className="font-semibold text-lg">My Issues</span>
            <div className='grow' />
            <input type="search" name="search" placeholder="Search" className="border border-stone-400 rounded-md px-4 py-2" />
            <Button type="submit">Search</Button>
          </fetcher.Form>
          <table>
            <thead>
              <tr>
                <Th>Date & Time</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {finalIssues.map(issue => (
                <IssueItem key={issue.id} {...issue} />
              ))}
              {!finalIssues.length && (
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
}
export function IssueItem(issue: IssueItemProps) {
  return (
    <tr key={issue.id}>
      <Td>{dayjs(issue.createdAt).format("YYYY/MM/DD HH:mm")}</Td>
      <Td>{issue.issueType.identifier}</Td>
      <Td width="40%">{issue.description}</Td>
      <Td>
        <span className={twMerge("text-orange-400", issue.status === IssueStatus.Resolved && "text-green-600")}>
          {issue.status}
        </span>
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