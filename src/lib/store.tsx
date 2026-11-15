import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { Activity, computeStreak, StreakInfo } from './streaks';
import { humanError, isLoginValid, loginToEmail, supabase } from './supabase';

/*
 * Данные приложения живут в Supabase (см. supabase/schema.sql).
 * Внутри приложения свой id всегда записывается как MY_ID = 'me' — так экранам
 * не нужно знать настоящий uuid. Перевод туда-обратно делают L() и R() ниже.
 */

export const MY_ID = 'me';

export type Role = 'user' | 'moderator';
export type User = { id: string; name: string; nickname: string };

export type Duo = {
  id: string;
  friendId: string;
  status: 'pending' | 'active';
  /** true — это меня позвали, и я должен принять. */
  incoming: boolean;
  createdAt: string;
  code: string;
};

export type Company = {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
  joinedAt: Record<string, string>;
  createdAt: string;
  ownerId: string;
  code: string;
};

export type Evening = {
  id: string;
  title: string;
  date: string;
  /** 'personal' или id дуо/компании */
  spaceId: string;
  participantIds: string[];
  photoUri?: string;
  note?: string;
  quote?: { text: string; authorId: string; time: string };
  createdBy: string;
  hidden?: boolean;
};

type Data = {
  me: User | null;
  role: Role;
  banned: boolean;
  people: Record<string, User>;
  personalStarted: boolean;
  duos: Duo[];
  companies: Company[];
  evenings: Evening[];
  activities: Activity[];
};

const EMPTY: Data = { me: null, role: 'user', banned: false, people: {}, personalStarted: false, duos: [], companies: [], evenings: [], activities: [] };

type SaveEveningInput = Omit<Evening, 'id' | 'createdBy' | 'date'> & { date?: string };

type Store = Data & {
  ready: boolean;
  signedIn: boolean;
  loading: boolean;
  friends: User[];
  isModerator: boolean;
  refresh: () => Promise<void>;
  userById: (id: string) => User;
  register: (name: string, login: string, password: string) => Promise<string | null>;
  login: (login: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  startPersonal: () => void;
  searchUsers: (q: string) => Promise<User[]>;
  inviteFriend: (friendId: string) => Promise<string>;
  acceptDuo: (duoId: string) => Promise<void>;
  declineDuo: (duoId: string) => Promise<void>;
  createCompany: (name: string, color: string) => Promise<string>;
  addToCompany: (companyId: string, ids: string[]) => Promise<void>;
  renameCompany: (companyId: string, name: string) => Promise<void>;
  removeFromCompany: (companyId: string, userId: string) => Promise<void>;
  leaveCompany: (companyId: string) => Promise<void>;
  saveEvening: (e: SaveEveningInput) => Promise<string>;
  recordActivity: (spaceId: string, kind?: string) => Promise<void>;
  report: (eveningId: string, reason: string) => Promise<void>;
  personalStreak: () => StreakInfo;
  duoStreak: (duo: Duo) => StreakInfo;
  companyStreak: (c: Company) => StreakInfo;
  spaceName: (spaceId: string) => string;
};

const Ctx = createContext<Store | null>(null);

const fail = (e: unknown): never => {
  throw new Error(humanError(e));
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data>(EMPTY);
  const uidRef = useRef<string | null>(null);

  const uid = session?.user.id ?? null;
  uidRef.current = uid;
  const L = useCallback((id: string | null | undefined) => (id && id === uidRef.current ? MY_ID : (id ?? '')), []);
  const R = useCallback((id: string) => (id === MY_ID ? (uidRef.current as string) : id), []);
  const spaceType = (spaceId: string, d: Data) =>
    spaceId === 'personal' ? 'personal' : d.duos.some((x) => x.id === spaceId) ? 'duo' : 'company';

  /* ───────── Загрузка всех данных пользователя ───────── */
  const load = useCallback(async () => {
    const me = uidRef.current;
    if (!me) return setData(EMPTY);
    setLoading(true);
    try {
      const [prof, duosQ, compQ, memQ, evQ, actQ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', me).single(),
        supabase.from('duos').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('company_members').select('*'),
        supabase.from('evenings').select('*, evening_participants(user_id)').order('date', { ascending: false }).limit(500),
        supabase.from('activities').select('user_id, space_type, space_id, at').gte('at', new Date(Date.now() - 400 * 864e5).toISOString()).limit(10000),
      ]);
      for (const q of [prof, duosQ, compQ, memQ, evQ, actQ]) if (q.error) throw q.error;

      // Профили всех, кто встречается в данных
      const ids = new Set<string>();
      duosQ.data!.forEach((d) => (ids.add(d.inviter), ids.add(d.invitee)));
      memQ.data!.forEach((m) => ids.add(m.user_id));
      evQ.data!.forEach((e) => (ids.add(e.created_by), e.quote_author && ids.add(e.quote_author)));
      ids.delete(me);
      const people: Record<string, User> = {};
      if (ids.size) {
        const { data: ps, error } = await supabase.from('profiles').select('id, nickname, name').in('id', [...ids]);
        if (error) throw error;
        ps!.forEach((p) => (people[p.id] = { id: p.id, name: p.name, nickname: p.nickname }));
      }

      // Подписанные ссылки на фото (bucket приватный)
      const paths = evQ.data!.map((e) => e.photo_path).filter(Boolean) as string[];
      const urls: Record<string, string> = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from('photos').createSignedUrls(paths, 60 * 60 * 24 * 7);
        signed?.forEach((s) => s.path && s.signedUrl && (urls[s.path] = s.signedUrl));
      }

      const duos: Duo[] = duosQ.data!.map((d) => ({
        id: d.id,
        friendId: d.inviter === me ? d.invitee : d.inviter,
        status: d.status,
        incoming: d.invitee === me && d.status === 'pending',
        createdAt: d.created_at,
        code: d.code,
      }));
      const companies: Company[] = compQ.data!.map((c) => {
        const ms = memQ.data!.filter((m) => m.company_id === c.id);
        return {
          id: c.id,
          name: c.name,
          color: c.color,
          ownerId: L(c.owner_id),
          createdAt: c.created_at,
          code: c.code,
          memberIds: ms.map((m) => L(m.user_id)),
          joinedAt: Object.fromEntries(ms.map((m) => [L(m.user_id), m.joined_at])),
        };
      });
      const sid = (t: string, s: string | null) => (t === 'personal' ? 'personal' : (s as string));
      const evenings: Evening[] = evQ.data!.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        spaceId: sid(e.space_type, e.space_id),
        participantIds: (e.evening_participants ?? []).map((p: { user_id: string }) => L(p.user_id)),
        photoUri: e.photo_path ? urls[e.photo_path] : undefined,
        note: e.note ?? undefined,
        quote: e.quote_text ? { text: e.quote_text, authorId: L(e.quote_author), time: e.quote_time ?? '' } : undefined,
        createdBy: L(e.created_by),
        hidden: e.hidden,
      }));
      const activities: Activity[] = actQ.data!.map((a) => ({ userId: L(a.user_id), spaceId: sid(a.space_type, a.space_id), at: a.at }));
      const flag = (await AsyncStorage.getItem(`trunken:personal:${me}`)) === '1';
      const p = prof.data!;
      setData({
        me: { id: MY_ID, name: p.name, nickname: p.nickname },
        role: p.role,
        banned: p.banned,
        people,
        personalStarted: flag || activities.some((a) => a.userId === MY_ID),
        duos,
        companies,
        evenings,
        activities,
      });
    } catch (e) {
      console.warn('[trunken] load failed', humanError(e));
    } finally {
      setLoading(false);
    }
  }, [L]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (uid) load();
    else setData(EMPTY);
  }, [uid, load]);

  /* ───────── Фото → Storage ───────── */
  const uploadPhoto = useCallback(async (uri: string): Promise<string> => {
    const me = uidRef.current!;
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    const path = `${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, buf, { contentType: 'image/jpeg', upsert: false });
    if (error) fail(error);
    return path;
  }, []);

  const store = useMemo<Store>(() => {
    const userById = (id: string): User => (id === MY_ID ? (data.me ?? { id, name: 'Ты', nickname: '' }) : (data.people[id] ?? { id, name: 'Друг', nickname: '' }));
    const friends = Object.values(data.people);
    const act = (spaceId: string, kind: string) => {
      const t = spaceType(spaceId, data);
      return { user_id: uidRef.current!, space_type: t, space_id: t === 'personal' ? null : spaceId, kind };
    };

    return {
      ...data,
      ready,
      signedIn: !!uid,
      loading,
      friends,
      isModerator: data.role === 'moderator' && !data.banned,
      refresh: load,
      userById,

      register: async (name, login, password) => {
        if (!isLoginValid(login)) return 'Логин: 3–32 символа, латиница, цифры, точка, дефис или _.';
        const { data: r, error } = await supabase.auth.signUp({
          email: loginToEmail(login),
          password,
          options: { data: { nickname: login.trim().toLowerCase(), name: name.trim() } },
        });
        if (error) return humanError(error);
        if (!r.session) return 'Аккаунт создан, но вход не выполнен: в Supabase включено подтверждение почты. Его нужно выключить.';
        return null;
      },
      login: async (login, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: loginToEmail(login), password });
        return error ? humanError(error) : null;
      },
      logout: async () => {
        await supabase.auth.signOut();
      },

      startPersonal: () => {
        AsyncStorage.setItem(`trunken:personal:${uidRef.current}`, '1').catch(() => {});
        setData((d) => ({ ...d, personalStarted: true }));
      },

      searchUsers: async (q) => {
        const s = q.trim().replace(/^@/, '').replace(/[%,()]/g, '');
        if (s.length < 2) return [];
        const { data: ps, error } = await supabase
          .from('profiles')
          .select('id, nickname, name')
          .or(`nickname.ilike.%${s}%,name.ilike.%${s}%`)
          .neq('id', uidRef.current!)
          .eq('banned', false)
          .limit(10);
        if (error) fail(error);
        return (ps ?? []).map((p) => ({ id: p.id, name: p.name, nickname: p.nickname }));
      },

      inviteFriend: async (friendId) => {
        const existing = data.duos.find((d) => d.friendId === friendId);
        if (existing) return existing.id;
        const { data: row, error } = await supabase.from('duos').insert({ inviter: uidRef.current, invitee: R(friendId) }).select('id').single();
        if (error) fail(error);
        await load();
        return row!.id as string;
      },
      acceptDuo: async (duoId) => {
        const { error } = await supabase.from('duos').update({ status: 'active' }).eq('id', duoId);
        if (error) fail(error);
        await load();
      },
      declineDuo: async (duoId) => {
        const { error } = await supabase.from('duos').delete().eq('id', duoId);
        if (error) fail(error);
        await load();
      },

      createCompany: async (name, color) => {
        const { data: row, error } = await supabase.from('companies').insert({ name: name.trim() || 'Наши люди', color, owner_id: uidRef.current }).select('id').single();
        if (error) fail(error);
        const { error: e2 } = await supabase.from('company_members').insert({ company_id: row!.id, user_id: uidRef.current });
        if (e2) fail(e2);
        await load();
        return row!.id as string;
      },
      addToCompany: async (companyId, ids) => {
        if (!ids.length) return;
        const { error } = await supabase.from('company_members').upsert(ids.map((i) => ({ company_id: companyId, user_id: R(i) })), { ignoreDuplicates: true });
        if (error) fail(error);
        await load();
      },
      renameCompany: async (companyId, name) => {
        const { error } = await supabase.from('companies').update({ name: name.trim() }).eq('id', companyId);
        if (error) fail(error);
        await load();
      },
      removeFromCompany: async (companyId, userId) => {
        const { error } = await supabase.from('company_members').delete().eq('company_id', companyId).eq('user_id', R(userId));
        if (error) fail(error);
        await load();
      },
      leaveCompany: async (companyId) => {
        const c = data.companies.find((x) => x.id === companyId);
        // Создатель уходит — компания удаляется целиком (вместе с её архивом).
        const q = c?.ownerId === MY_ID
          ? supabase.from('companies').delete().eq('id', companyId)
          : supabase.from('company_members').delete().eq('company_id', companyId).eq('user_id', uidRef.current!);
        const { error } = await q;
        if (error) fail(error);
        await load();
      },

      saveEvening: async (e) => {
        const t = spaceType(e.spaceId, data);
        const photo_path = e.photoUri && !/^https?:/.test(e.photoUri) ? await uploadPhoto(e.photoUri) : null;
        const { data: row, error } = await supabase
          .from('evenings')
          .insert({
            space_type: t,
            space_id: t === 'personal' ? null : e.spaceId,
            title: e.title,
            note: e.note ?? null,
            quote_text: e.quote?.text ?? null,
            quote_author: e.quote ? R(e.quote.authorId) : null,
            quote_time: e.quote?.time ?? null,
            photo_path,
            created_by: uidRef.current,
            date: e.date ?? new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) fail(error);
        const parts = [...new Set([MY_ID, ...e.participantIds])].map((p) => ({ evening_id: row!.id, user_id: R(p) }));
        const { error: e2 } = await supabase.from('evening_participants').insert(parts);
        if (e2) fail(e2);
        const { error: e3 } = await supabase.from('activities').insert(act(e.spaceId, e.quote ? 'quote' : photo_path ? 'photo' : 'evening'));
        if (e3) fail(e3);
        AsyncStorage.setItem(`trunken:personal:${uidRef.current}`, '1').catch(() => {});
        await load();
        return row!.id as string;
      },
      recordActivity: async (spaceId, kind = 'vote') => {
        const { error } = await supabase.from('activities').insert(act(spaceId, kind));
        if (error) fail(error);
        await load();
      },
      report: async (eveningId, reason) => {
        const { error } = await supabase.from('reports').insert({ reporter: uidRef.current, evening_id: eveningId, reason });
        if (error) fail(error);
      },

      personalStreak: () => computeStreak({ kind: 'personal', spaceId: MY_ID, memberIds: [MY_ID], activities: data.activities }),
      duoStreak: (duo) => computeStreak({ kind: 'duo', spaceId: duo.id, memberIds: [MY_ID, duo.friendId], activities: data.activities }),
      companyStreak: (c) =>
        computeStreak({ kind: 'company', spaceId: c.id, memberIds: c.memberIds, joinedAt: c.joinedAt, createdAt: c.createdAt, activities: data.activities }),

      spaceName: (spaceId) => {
        if (spaceId === 'personal') return 'Личное';
        const d = data.duos.find((x) => x.id === spaceId);
        if (d) return `Ты + ${userById(d.friendId).name}`;
        return data.companies.find((c) => c.id === spaceId)?.name ?? 'Архив';
      },
    };
  }, [data, ready, uid, loading, load, R, uploadPhoto]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore вне StoreProvider');
  return s;
}
