import { adminGetZonalStaffAssignmentsAction } from "@/actions/admin/staff-delegation";
import { StaffDelegationClient } from "@/components/admin/staff-delegation-client";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const res = await adminGetZonalStaffAssignmentsAction();
  const matrix = res.matrix || [];

  return (
    <div className="space-y-6">
      <StaffDelegationClient initialMatrix={matrix} />
    </div>
  );
}
