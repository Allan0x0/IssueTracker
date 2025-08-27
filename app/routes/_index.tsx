import { redirect } from "react-router";
import { AppLinks } from "~/links";
import { requireUser } from "~/sessions.server";
import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.isAdmin) {
    return redirect(AppLinks.Admin.Index);
  } else {
    return redirect(AppLinks.Client.Index);
  }
}