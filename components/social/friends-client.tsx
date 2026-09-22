"use client";

import { redirect } from "next/navigation";
import React from "react";

export function FriendsClient() {
  redirect("/app/discover");
  return null;
}
