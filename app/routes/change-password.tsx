import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import z from "zod";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import prisma from "~/db.server";
import { requireUserId } from "~/sessions.server";
import { getErrorMessage, hasErr, hasSuccess } from "~/utils";
import { getRawFormFields } from "~/utils.server";
import type { Route } from "./+types/change-password";
import { AppLinks } from "~/links";

const Schema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string(),
    reEnterPassword: z.string(),
  })
  .refine(data => data.newPassword === data.reEnterPassword, {
    message: "Passwords don't match",
    path: ["newPassword"],
  });
export async function action({ request }: Route.ActionArgs) {
  const currentUserId = await requireUserId(request);
  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return { err: result.error.message }
    }
    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) {
      return { err: "User not found" }
    }
    if (user.password !== currentPassword) {
      return { err: "Invalid password, please try again" }
    }

    await prisma.user.update({
      where: { id: currentUserId },
      data: { password: newPassword }
    });

    return { success: true }
  } catch (err) {
    return { err: getErrorMessage(err) }
  }
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const isProcessing = fetcher.state !== 'idle';

  useEffect(() => {
    if (hasErr(fetcher.data)) {
      window.alert("Error: " + fetcher.data.err);
    }
    if (hasSuccess(fetcher.data)) {
      window.alert("Changed password successfully!");
      navigate(AppLinks.Index);
    }
  }, [fetcher.data]);

  function back () {
    navigate(-1);
  }

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <div className="flex flex-col items-stretch w-full md:w-auto md:max-w-4xl md:min-w-2xl bg-white rounded-md p-6">
        <div className="flex flex-row items-center gap-2">
          <h1 className="text-xl font-semibold">Change My Password</h1>
          <div className='grow' />
          <button onClick={back} className="text-blue-600 cursor-pointer hover:underline text-sm">
            Back
          </button>
        </div>
        <fetcher.Form method="post" className="flex flex-col items-stretch pt-16 gap-2">
          <Input type="password" name="currentPassword" label="Current Password" required />
          <Input type="password" name="newPassword" label="New Password" required />
          <Input type="password" name="reEnterPassword" label="Re-Enter New Password" required />
          <div className="flex flex-col items-stretch pt-6">
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  )
}