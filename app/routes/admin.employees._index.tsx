import type { ComponentProps } from "react";
import { Link, useLoaderData } from "react-router";
import prisma from "~/db.server";
import { AppLinks } from "~/links";
import type { Route } from "./+types/admin.employees._index";

export async function loader(_: Route.LoaderArgs) {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    include: { _count: { select: { issues: true } } }
  });
  return { users }
}

export default function EmpployeesIndexPage() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-stretch">
      <div className="flex flex-row items-center gap-2">
        <h1 className="text-xl font-semibold">Admin - Employees</h1>
        <div className='grow' />
        <Link to={AppLinks.Admin.Employees.Create} className="text-blue-600 hover:underline text-sm">
          Create New Employee
        </Link>
      </div>
      <div className="flex flex-col items-stretch py-16 gap-2">
        <table>
          <thead>
            <tr>
              <Th>Username</Th>
              <Th>First Name</Th>
              <Th>Last Name</Th>
              <Th># of Issues</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <Td>{user.username}</Td>
                <Td>{user.firstName}</Td>
                <Td>{user.lastName}</Td>
                <Td>{user._count.issues}</Td>
                <Td>
                  <Link
                    to={AppLinks.Admin.Employees.Edit(user.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit Record
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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