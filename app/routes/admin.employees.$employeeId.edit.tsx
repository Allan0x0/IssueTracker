import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import z from "zod";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import prisma from "~/db.server";
import { getErrorMessage, hasErr, hasSuccess } from "~/utils";
import { getRawFormFields } from "~/utils.server";
import type { Route } from "./+types/admin.employees.$employeeId.edit";

export async function loader({ params }: Route.LoaderArgs) {
  const result = z.coerce.number().safeParse(params.employeeId);
  if (!result.success) {
    throw new Response("Invalid employee ID provided", { status: 400 });
  }
  const employeeId = result.data;
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
  });
  if (!user) {
    throw new Response("Employee record not found", { status: 404 });
  }
  return { user }
}

const Schema = z.object({
  // username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
export async function action({ request, params }: Route.ActionArgs) {
  try {
    const idResult = z.coerce.number().safeParse(params.employeeId);
    if (!idResult.success) {
      throw new Response("Invalid employee ID provided", { status: 400 });
    }
    const employeeId = idResult.data;
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return { err: result.error.message };
    }
    // const { username, firstName, lastName } = result.data;
    const { firstName, lastName } = result.data;

    await prisma.user.update({
      where: { id: employeeId },
      // data: { username, firstName, lastName },
      data: { firstName, lastName },
    });

    return { success: true }
  } catch (err) {
    return { err: getErrorMessage(err) }
  }
}

export default function EmployeePage() {
  const { user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';

  useEffect(() => {
    if (hasErr(fetcher.data)) {
      window.alert("Error: " + fetcher.data.err);
    }
    if (hasSuccess(fetcher.data)) {
      window.alert("Updated employee successfully!");
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-col items-start">
      <h1 className="text-xl font-semibold">Admin - Update Employee</h1>
      <fetcher.Form method="post" className="flex flex-col items-stretch py-16 gap-2 max-w-4xl min-w-2xl">
        {/* <Input type="text" name="username" label="Username" defaultValue={user.username} required /> */}
        <Input type="text" name="firstName" label="First Name" defaultValue={user.firstName} required />
        <Input type="text" name="lastName" label="Last Name" defaultValue={user.lastName} required />
        <div className="flex flex-col items-stretch py-6">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  )
}