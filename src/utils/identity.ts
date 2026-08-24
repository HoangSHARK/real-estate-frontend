const ANONYMOUS_USER_STORAGE_KEY = 'real-estate-agent.anonymous-user-id.v1';
const anonymousUserPattern = /^anon_[A-Za-z0-9_-]{8,80}$/;

interface IdentityStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

let inMemoryAnonymousUserId: string | undefined;

const randomPart = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

export const createMessageId = () => `msg_${randomPart()}`;

export const createThreadId = () => `session_${randomPart()}`;

const browserStorage = (): IdentityStorage | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

export const getOrCreateAnonymousUserId = (
  storage: IdentityStorage | undefined = browserStorage(),
) => {
  if (!storage && inMemoryAnonymousUserId) return inMemoryAnonymousUserId;

  try {
    const stored = storage?.getItem(ANONYMOUS_USER_STORAGE_KEY);
    if (stored && anonymousUserPattern.test(stored)) return stored;

    const generated = `anon_${randomPart()}`;
    storage?.setItem(ANONYMOUS_USER_STORAGE_KEY, generated);
    const persisted = storage?.getItem(ANONYMOUS_USER_STORAGE_KEY);
    if (persisted && anonymousUserPattern.test(persisted)) return persisted;
    inMemoryAnonymousUserId = generated;
    return generated;
  } catch {
    inMemoryAnonymousUserId ??= `anon_${randomPart()}`;
    return inMemoryAnonymousUserId;
  }
};
