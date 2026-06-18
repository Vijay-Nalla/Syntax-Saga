import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Language } from './types';

// Stable per-browser user id (no auth — game lobby with room-code shared secret)
export function getUserId(): string {
  let id = localStorage.getItem('mp_user_id');
  if (!id) {
    id = (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('mp_user_id', id);
  }
  return id;
}

// Per-room session token for security (server validates membership via this).
function tokenKey(room: string) { return `mp_session:${room}`; }
function getOrMakeSessionToken(room: string): string {
  let t = sessionStorage.getItem(tokenKey(room));
  if (!t) {
    t = (crypto as any).randomUUID ? (crypto as any).randomUUID()
      : 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(tokenKey(room), t);
  }
  return t;
}
function getDeviceId(): string {
  let d = localStorage.getItem('mp_device_id');
  if (!d) {
    d = (crypto as any).randomUUID ? (crypto as any).randomUUID() : 'dev_' + Math.random().toString(36).slice(2);
    localStorage.setItem('mp_device_id', d);
  }
  return d;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 5; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

export interface RoomRow {
  code: string;
  host_id: string;
  language: Language;
  level: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface PlayerRow {
  room_code: string;
  user_id: string;
  name: string;
  ready: boolean;
  is_host: boolean;
  score: number;
  coins: number;
  challenges_won: number;
  correct_answers: number;
  wrong_answers: number;
  finished: boolean;
  last_seen: string;
}

export interface RemotePos {
  user_id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  facing: 'left' | 'right';
  isUnderground: boolean;
  level: number;
}

type Listener<T> = (v: T) => void;

export class MultiplayerSession {
  userId: string;
  roomCode: string;
  isHost: boolean;
  name: string;
  private channel: RealtimeChannel | null = null;
  private posListeners = new Set<Listener<RemotePos>>();
  private roomListeners = new Set<Listener<RoomRow>>();
  private playersListeners = new Set<Listener<PlayerRow[]>>();
  private lockListeners = new Set<Listener<{ level: number; challenge_id: number; owner_id: string; owner_name: string }>>();
  private heartbeatTimer: number | null = null;

  sessionToken: string = '';

  constructor(roomCode: string, isHost: boolean, name: string) {
    this.userId = getUserId();
    this.roomCode = roomCode;
    this.isHost = isHost;
    this.name = name;
    this.sessionToken = getOrMakeSessionToken(roomCode);
  }

  async createRoom(language: Language): Promise<{ error: string | null }> {
    const { error } = await supabase.from('mp_rooms').insert({
      code: this.roomCode,
      host_id: this.userId,
      language,
      level: 1,
      status: 'waiting',
    });
    if (error) return { error: error.message };
    await this.joinAsPlayer(true);
    return { error: null };
  }

  async joinRoom(): Promise<{ error: string | null }> {
    const { data: room, error } = await supabase
      .from('mp_rooms').select('*').eq('code', this.roomCode).maybeSingle();
    if (error) return { error: error.message };
    if (!room) return { error: 'Room not found.' };
    if ((room as any).status === 'finished') return { error: 'This match has ended.' };
    if ((room as any).expires_at && new Date((room as any).expires_at).getTime() < Date.now()) {
      return { error: 'This room has expired.' };
    }
    const { count } = await supabase
      .from('mp_room_players').select('*', { count: 'exact', head: true }).eq('room_code', this.roomCode);
    if ((count ?? 0) >= 2) {
      const { data: mine } = await supabase
        .from('mp_room_players').select('user_id').eq('room_code', this.roomCode).eq('user_id', this.userId).maybeSingle();
      if (!mine) return { error: 'Room is full.' };
    }
    await this.joinAsPlayer(false);
    return { error: null };
  }

  private async joinAsPlayer(isHost: boolean) {
    await supabase.from('mp_room_players').upsert({
      room_code: this.roomCode,
      user_id: this.userId,
      name: this.name,
      is_host: isHost,
      ready: false,
      session_token: this.sessionToken,
      device_id: getDeviceId(),
      last_seen: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    } as any, { onConflict: 'room_code,user_id' });
  }

  subscribe() {
    if (this.channel) return;
    this.channel = supabase
      .channel(`room:${this.roomCode}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mp_rooms', filter: `code=eq.${this.roomCode}` },
        (payload) => {
          if (payload.new) this.roomListeners.forEach(l => l(payload.new as RoomRow));
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mp_room_players', filter: `room_code=eq.${this.roomCode}` },
        async () => {
          const { data } = await supabase.from('mp_room_players').select('*').eq('room_code', this.roomCode);
          if (data) this.playersListeners.forEach(l => l(data as PlayerRow[]));
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mp_challenge_locks', filter: `room_code=eq.${this.roomCode}` },
        (payload) => {
          const r = payload.new as any;
          this.lockListeners.forEach(l => l({ level: r.level, challenge_id: r.challenge_id, owner_id: r.owner_id, owner_name: r.owner_name }));
        })
      .on('broadcast', { event: 'pos' }, ({ payload }) => {
        this.posListeners.forEach(l => l(payload as RemotePos));
      })
      .subscribe();

    // initial pulls
    this.refresh();

    // heartbeat
    this.heartbeatTimer = window.setInterval(() => {
      supabase.from('mp_room_players')
        .update({ last_seen: new Date().toISOString() })
        .eq('room_code', this.roomCode).eq('user_id', this.userId).then();
    }, 5000);
  }

  async refresh() {
    const [{ data: room }, { data: players }] = await Promise.all([
      supabase.from('mp_rooms').select('*').eq('code', this.roomCode).maybeSingle(),
      supabase.from('mp_room_players').select('*').eq('room_code', this.roomCode),
    ]);
    if (room) this.roomListeners.forEach(l => l(room as RoomRow));
    if (players) this.playersListeners.forEach(l => l(players as PlayerRow[]));
  }

  onRoom(l: Listener<RoomRow>) { this.roomListeners.add(l); return () => this.roomListeners.delete(l); }
  onPlayers(l: Listener<PlayerRow[]>) { this.playersListeners.add(l); return () => this.playersListeners.delete(l); }
  onPosition(l: Listener<RemotePos>) { this.posListeners.add(l); return () => this.posListeners.delete(l); }
  onLock(l: Listener<{ level: number; challenge_id: number; owner_id: string; owner_name: string }>) { this.lockListeners.add(l); return () => this.lockListeners.delete(l); }

  async setReady(ready: boolean) {
    await supabase.from('mp_room_players').update({ ready })
      .eq('room_code', this.roomCode).eq('user_id', this.userId);
  }

  async setLanguage(language: Language) {
    if (!this.isHost) return;
    await supabase.from('mp_rooms').update({ language }).eq('code', this.roomCode);
  }

  async startMatch() {
    if (!this.isHost) return;
    await supabase.from('mp_rooms').update({ status: 'playing' }).eq('code', this.roomCode);
  }

  sendPosition(pos: Omit<RemotePos, 'user_id' | 'name'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast', event: 'pos',
      payload: { ...pos, user_id: this.userId, name: this.name },
    });
  }

  async claimChallenge(level: number, challengeId: number, topic: string): Promise<{ owned: boolean; ownerName?: string }> {
    const { error } = await supabase.from('mp_challenge_locks').insert({
      room_code: this.roomCode, level, challenge_id: challengeId,
      owner_id: this.userId, owner_name: this.name, topic, status: 'locked',
    });
    if (!error) return { owned: true };
    // unique violation -> someone else owns it
    const { data } = await supabase.from('mp_challenge_locks')
      .select('owner_name').eq('room_code', this.roomCode).eq('level', level).eq('challenge_id', challengeId).maybeSingle();
    return { owned: false, ownerName: data?.owner_name };
  }

  async completeChallenge(level: number, challengeId: number, correct: boolean) {
    await supabase.from('mp_challenge_locks')
      .update({ status: 'completed', solved_correctly: correct })
      .eq('room_code', this.roomCode).eq('level', level).eq('challenge_id', challengeId).eq('owner_id', this.userId);
  }

  async updateStats(patch: Partial<Pick<PlayerRow, 'score' | 'coins' | 'challenges_won' | 'correct_answers' | 'wrong_answers' | 'finished'>>) {
    await supabase.from('mp_room_players').update(patch)
      .eq('room_code', this.roomCode).eq('user_id', this.userId);
  }

  async leave() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.channel) { await supabase.removeChannel(this.channel); this.channel = null; }
    await supabase.from('mp_room_players').delete()
      .eq('room_code', this.roomCode).eq('user_id', this.userId);
    if (this.isHost) {
      // host leaves -> end room
      await supabase.from('mp_rooms').update({ status: 'finished' }).eq('code', this.roomCode);
    }
  }
}
