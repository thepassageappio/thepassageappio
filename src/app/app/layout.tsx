import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { getAuthorityAccessContext } from "@/lib/authority/access";

export const dynamic = "force-dynamic";

export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (access.membership?.status === "revoked") redirect("/start?error=access_revoked");
  if (!access.membership || !access.organization) redirect("/onboarding/organization");
  if (access.organization.status !== "active") redirect("/start?error=access_unavailable");
  if (access.organization.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  if (access.organization.onboardingStatus === "template_required") redirect("/onboarding/template");

  return <AppShell access={access}>{children}</AppShell>;
}
