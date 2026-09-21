import { redirect } from "next/navigation";
import { getZonalStaffSession } from "@/actions/staff/auth";
import { ZonalStaffLoginForm } from "@/components/staff/staff-login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zonal Staff Portal • VIBE 2026",
  description: "Dedicated check-in station & coin collection console for authorized Zonal Heads & Staff.",
};

export default async function ZonalStaffLoginPage() {
  const staff = await getZonalStaffSession();
  if (staff) {
    redirect("/staff");
  }

  return <ZonalStaffLoginForm />;
}
