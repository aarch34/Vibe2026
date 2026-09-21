export interface ZonalStaffUser {
  username: string;
  zoneSlug: string;
  zoneId: string;
  zoneName: string;
  headName: string;
  staffType?: "zonal_head" | "zonal_staff";
  email?: string;
  loggedInAt: number;
}

export const ZONAL_CREDENTIALS: Record<
  string,
  { pass: string; zoneSlug: string; zoneId: string; zoneName: string; headName: string }
> = {
  arnava1: {
    pass: "arnava@vibe2026",
    zoneSlug: "arnava",
    zoneId: "d0000000-0000-0000-0000-000000000001",
    zoneName: "Arnava",
    headName: "Zonal Head 1 (Arnava)",
  },
  arnava2: {
    pass: "arnava@vibe2026",
    zoneSlug: "arnava",
    zoneId: "d0000000-0000-0000-0000-000000000001",
    zoneName: "Arnava",
    headName: "Zonal Head 2 (Arnava)",
  },
  taranaga1: {
    pass: "taranaga@vibe2026",
    zoneSlug: "taranaga",
    zoneId: "d0000000-0000-0000-0000-000000000002",
    zoneName: "Taranaga",
    headName: "Zonal Head 1 (Taranaga)",
  },
  taranaga2: {
    pass: "taranaga@vibe2026",
    zoneSlug: "taranaga",
    zoneId: "d0000000-0000-0000-0000-000000000002",
    zoneName: "Taranaga",
    headName: "Zonal Head 2 (Taranaga)",
  },
  sagara1: {
    pass: "sagara@vibe2026",
    zoneSlug: "sagara",
    zoneId: "d0000000-0000-0000-0000-000000000003",
    zoneName: "Sagara",
    headName: "Zonal Head 1 (Sagara)",
  },
  sagara2: {
    pass: "sagara@vibe2026",
    zoneSlug: "sagara",
    zoneId: "d0000000-0000-0000-0000-000000000003",
    zoneName: "Sagara",
    headName: "Zonal Head 2 (Sagara)",
  },
  pravaha1: {
    pass: "pravaha@vibe2026",
    zoneSlug: "pravaha",
    zoneId: "d0000000-0000-0000-0000-000000000004",
    zoneName: "Pravaha",
    headName: "Zonal Head 1 (Pravaha)",
  },
  pravaha2: {
    pass: "pravaha@vibe2026",
    zoneSlug: "pravaha",
    zoneId: "d0000000-0000-0000-0000-000000000004",
    zoneName: "Pravaha",
    headName: "Zonal Head 2 (Pravaha)",
  },
  samudhra1: {
    pass: "samudhra@vibe2026",
    zoneSlug: "samudhra",
    zoneId: "d0000000-0000-0000-0000-000000000005",
    zoneName: "Samudhra",
    headName: "Zonal Head 1 (Samudhra)",
  },
  samudhra2: {
    pass: "samudhra@vibe2026",
    zoneSlug: "samudhra",
    zoneId: "d0000000-0000-0000-0000-000000000005",
    zoneName: "Samudhra",
    headName: "Zonal Head 2 (Samudhra)",
  },
  varuna1: {
    pass: "varuna@vibe2026",
    zoneSlug: "varuna",
    zoneId: "d0000000-0000-0000-0000-000000000006",
    zoneName: "Varuna",
    headName: "Zonal Head 1 (Varuna)",
  },
  varuna2: {
    pass: "varuna@vibe2026",
    zoneSlug: "varuna",
    zoneId: "d0000000-0000-0000-0000-000000000006",
    zoneName: "Varuna",
    headName: "Zonal Head 2 (Varuna)",
  },
};
