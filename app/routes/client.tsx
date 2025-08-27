import type { ComponentProps } from "react";
import { NavLink, Outlet, redirect, useLoaderData } from "react-router";
import { twMerge } from "tailwind-merge";
import { AppLinks } from "~/links";
import { requireUser } from "~/sessions.server";
import type { Route } from "./+types/_index";
import { DropDownMenu } from "~/components/DropDownMenu";

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.isAdmin) {
    return redirect(AppLinks.Admin.Index);
  }
  return null
}

export default function Client() {
  useLoaderData();

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-6 p-6 h-screen">
      <div className="flex flex-row md:flex-col md:items-stretch bg-white rounded-md p-6 shadow-xl shrink-0">
        <h1 className="text-xl font-semibold">Parking Issue Tracker</h1>
        <div className='flex md:hidden grow' />
        <DropDownMenu className="flex md:hidden" />
        <div className="md:flex hidden flex-col items-stretch pt-16 gap-4 grow">
          <NavItem to={AppLinks.Client.Index} end>My Issues</NavItem>
          <NavItem to={AppLinks.Client.SendIssue}>Send Issue</NavItem>
          <div className='grow' />
          <NavItem to={AppLinks.ChangePassword}>Change My Password</NavItem>
          <form method="post" action={AppLinks.Logout} className="flex flex-col items-stretch">
            <button type="submit" className={getBaseButtonClx()}>Log Out</button>
          </form>
        </div>
      </div>
      <div className="flex flex-col items-stretch bg-white rounded-md grow shadow-xl p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

function getBaseButtonClx() {
  return twMerge("bg-blue-50 rounded-md px-6 py-4 hover:bg-blue-100 text-left cursor-pointer");
}

interface NavItemProps extends ComponentProps<typeof NavLink> {
}
function NavItem(props: NavItemProps) {
  const { to, className, children, ...rest } = props;
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        return twMerge(getBaseButtonClx(), isActive && "bg-blue-600 text-white hover:bg-blue-600");
      }}
      {...rest}
    >
      {children}
    </NavLink>
  )
}