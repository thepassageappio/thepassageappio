"use server";

import { cookies } from "next/headers";
import { getAuthorityAppUrl } from "@/lib/supabase/config";
import {
  INVITE_ACCESS_LINK_COOKIE,
  type InviteAccessLinkFlash,
} from "@/lib/authority/invite-access-link-flash";

export async function setInviteAccessLinkFlash(flash: InviteAccessLinkFlash) {
  const cookieStore = await cookies();
  cookieStore.set(INVITE_ACCESS_LINK_COOKIE, JSON.stringify(flash), {
    httpOnly: true,
    secure: flash.url.startsWith("https://"),
    sameSite: "lax",
    path: `/app/requests/${flash.recordId}`,
    maxAge: 60 * 10,
  });
}

export async function dismissInviteAccessLinkFlashAction(recordId: string) {
  const id = recordId.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(INVITE_ACCESS_LINK_COOKIE, "", {
    httpOnly: true,
    secure: getAuthorityAppUrl().startsWith("https://"),
    sameSite: "lax",
    path: `/app/requests/${id}`,
    maxAge: 0,
  });
}
