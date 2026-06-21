// Friend system: send/accept/decline requests, list friends and pending invites.
import { supabase } from "@/integrations/supabase/client";

export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";
export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
}
export interface FriendView {
  id: string;
  friend_user_id: string;
  username: string | null;
  status: FriendStatus;
  direction: "incoming" | "outgoing";
}

export async function sendFriendRequest(addresseeUsername: string): Promise<{ error: string | null }> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return { error: "Not signed in" };
  const target = addresseeUsername.trim();
  if (!target) return { error: "Username required" };
  const { data: prof } = await supabase.from("profiles").select("user_id, username").eq("username", target).maybeSingle();
  if (!prof) return { error: "Player not found" };
  if (prof.user_id === me.user.id) return { error: "Cannot add yourself" };
  const { error } = await supabase.from("friendships").insert({
    requester_id: me.user.id, addressee_id: prof.user_id, status: "pending",
  });
  if (error) {
    if (error.code === "23505") return { error: "Request already exists" };
    return { error: error.message };
  }
  return { error: null };
}

export async function respondToRequest(id: string, accept: boolean): Promise<void> {
  await supabase.from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", id);
}

export async function removeFriendship(id: string): Promise<void> {
  await supabase.from("friendships").delete().eq("id", id);
}

export async function listFriends(): Promise<FriendView[]> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return [];
  const uid = me.user.id;
  const { data: rows } = await supabase.from("friendships").select("*")
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
  if (!rows) return [];
  const otherIds = rows.map((r: any) => r.requester_id === uid ? r.addressee_id : r.requester_id);
  const { data: profs } = await supabase.from("profiles").select("user_id, username").in("user_id", otherIds);
  const byId = new Map((profs || []).map((p: any) => [p.user_id, p.username]));
  return (rows as any[]).map(r => ({
    id: r.id,
    friend_user_id: r.requester_id === uid ? r.addressee_id : r.requester_id,
    username: byId.get(r.requester_id === uid ? r.addressee_id : r.requester_id) || null,
    status: r.status,
    direction: r.requester_id === uid ? "outgoing" : "incoming",
  }));
}
