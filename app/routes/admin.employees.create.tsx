import z from "zod";
import type { Route } from "./+types/admin.employees.create";
import { getRawFormFields } from "~/utils.server";
import prisma from "~/db.server";
import { redirect, useFetcher } from "react-router";
import { AppLinks } from "~/links";
import { getErrorMessage, hasErr, hasSuccess } from "~/utils";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { useEffect } from "react";

const Schema = z
  .object({
    username: z.string().min(3),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(4),
    reEnterPassword: z.string().min(4),
  })
  .refine(data => data.password === data.reEnterPassword, {
    message: "Passwords don't match",
    path: ["password"]
  });
export async function action({ request }: Route.ActionArgs) {
  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return { err: result.error.message };
    }
    const { username, firstName, lastName, password } = result.data;

    const numDuplicates = await prisma.user.count({
      where: { username },
    });
    if (numDuplicates) {
      return { err: "Username already taken, select another" }
    }

    await prisma.user.create({
      data: { username, firstName, lastName, password, isAdmin: false }
    });

    return redirect(AppLinks.Admin.Employees.Index);
  } catch (err) {
    return { err: getErrorMessage(err) }
  }
}

export default function EmployeesCreatePage() {
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';

  useEffect(() => {
    if (hasErr(fetcher.data)) {
      window.alert("Error: " + fetcher.data.err);
    }
    if (hasSuccess(fetcher.data)) {
      window.alert("Created employee successfully!");
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-col items-start">
      <h1 className="text-xl font-semibold">Admin - Create Employee</h1>
      <fetcher.Form method="post" className="flex flex-col items-stretch py-16 gap-2 max-w-4xl min-w-2xl">
        <Input type="text" name="username" label="Username" required />
        <Input type="text" name="firstName" label="First Name" required />
        <Input type="text" name="lastName" label="Last Name" required />
        <Input type="password" name="password" label="Password" required />
        <Input type="password" name="reEnterPassword" label="Re-Enter Password" required />
        <div className="flex flex-col items-stretch py-6">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  )
}