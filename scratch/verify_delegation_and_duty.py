import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv(".env.local")

BASE_URL = "http://localhost:3000"

def main():
    results = {}

    print("=== 1. Testing District Admin Staff Delegation Console (Authenticated) ===")
    admin_session = requests.Session()
    admin_cookie = {
        "username": "jk",
        "name": "JK",
        "role": "admin",
        "loggedInAt": int(time.time() * 1000)
    }
    admin_session.cookies.set("vibe_admin_auth", json.dumps(admin_cookie))
    
    staff_page_res = admin_session.get(f"{BASE_URL}/admin/staff")
    print(f"Admin /admin/staff status: {staff_page_res.status_code}")
    results["admin_staff_page_status"] = staff_page_res.status_code
    results["has_zone_delegation_heading"] = "Zonal Staff & Duty Delegation" in staff_page_res.text
    results["has_all_6_zones"] = all(z in staff_page_res.text for z in ["Arnava", "Taranaga", "Sagara", "Pravaha", "Samudhra", "Varuna"])
    results["has_assign_staff_button"] = "Assign Staff" in staff_page_res.text or "Assign New Staff Member" in staff_page_res.text

    print(f"  Heading found: {results['has_zone_delegation_heading']}")
    print(f"  All 6 Oceanic zones present: {results['has_all_6_zones']}")

    print("\n=== 2. Testing Zonal Head Staff Portal (Authenticated as Arnava Head) ===")
    zonal_session = requests.Session()
    zonal_cookie = {
        "username": "arnava1",
        "zoneSlug": "arnava",
        "zoneId": "zone-1",
        "zoneName": "Arnava",
        "headName": "Rtr. Vikram Sen",
        "loggedInAt": int(time.time() * 1000)
    }
    zonal_session.cookies.set("vibe_zonal_auth", json.dumps(zonal_cookie))

    staff_portal_res = zonal_session.get(f"{BASE_URL}/staff")
    print(f"Staff portal status: {staff_portal_res.status_code}")
    results["staff_portal_status"] = staff_portal_res.status_code
    results["staff_portal_has_award_duty_xp"] = "Award Duty XP" in staff_portal_res.text
    results["staff_portal_has_duty_awards_tab"] = "Volunteer Duty Awards" in staff_portal_res.text
    results["staff_portal_has_zone_arnava"] = "Arnava" in staff_portal_res.text

    print(f"  'Award Duty XP' CTA present: {results['staff_portal_has_award_duty_xp']}")
    print(f"  'Volunteer Duty Awards' tab present: {results['staff_portal_has_duty_awards_tab']}")
    print(f"  Zone Arnava portal active: {results['staff_portal_has_zone_arnava']}")

    print("\n=== 3. Testing Attendee Security Gate (Redirects to /sign-in) ===")
    anon_session = requests.Session()
    anon_res = anon_session.get(f"{BASE_URL}/app", allow_redirects=False)
    print(f"Unauthenticated /app status: {anon_res.status_code}, Location: {anon_res.headers.get('Location')}")
    results["attendee_redirect_to_signin"] = anon_res.status_code in [302, 307, 308] and "/sign-in" in str(anon_res.headers.get('Location'))

    print("\n=== FINAL RESULTS ===")
    print(json.dumps(results, indent=2))

    with open("scratch/delegation_and_duty_verification.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
