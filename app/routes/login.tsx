import z from "zod";
import type { Route } from "./+types/login";
import { getRawFormFields } from "~/utils.server";
import { createUserSession } from "~/sessions.server";
import { AppLinks } from "~/links";
import { useFetcher, useLoaderData } from "react-router";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import prisma from "~/db.server";
import { useEffect } from "react";
import { hasErr } from "~/utils";

export async function loader(_: Route.LoaderArgs) {
  const numAdmins = await prisma.user.count({
    where: { isAdmin: true },
  });
  if (!numAdmins) {
    await prisma.user.create({
      data: {
        isAdmin: true,
        username: "Admin",
        password: "default@7891",
        firstName: "System",
        lastName: "Admin",
      }
    });
  }
  return null
}

const Schema = z.object({
  username: z.string(),
  password: z.string(),
});
export async function action({ request }: Route.ActionArgs) {
  const fields = await getRawFormFields(request);
  const result = Schema.safeParse(fields);
  if (!result.success) {
    return { err: result.error.message };
  }
  const { username, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, password: true, isAdmin: true },
  });
  if (!user) {
    return { err: "User not found" };
  }
  if (user.password !== password) {
    return { err: "Incorrect password" };
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo: user.isAdmin ? AppLinks.Admin.Index : AppLinks.Client.Index,
  });
}

export default function LoginPage() {
  useLoaderData();
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';
  
  useEffect(() => {
    if (hasErr(fetcher.data)) {
      window.alert(fetcher.data.err);
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <fetcher.Form method="post" className="max-w-4xl flex flex-col items-stretch bg-white rounded-md px-6">
        <div className="flex flex-col justify-center items-center p-6">
          <h1 className="text-2xl font-semibold">Parking Issues Tracker - Login</h1>
        </div>
        <div className="flex flex-col items-stretch gap-6 py-6">
          <Input type="text" name="username" label="Username" required />
          <Input type="password" name="password" label="Password" required />
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? "Logging In": "Log In"}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  )
}