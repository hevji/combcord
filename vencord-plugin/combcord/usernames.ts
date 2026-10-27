/**
 * Client-side username and display-name overrides.
 *
 * - Username is the account's actual handle (`user.username`, the value shown
 *   after "@").
 * - Display name is the profile's display name (`user.globalName`).
 *
 * Both properties are independent. We patch the cached user object in place so
 * React keeps stable identities, and wrap the pure UsernameUtils helpers for
 * surfaces that copy user fields. Server nicknames are deliberately not
 * changed: they are a third, separate property.
 *
 * Nothing is sent to Discord; this only changes what this client renders.
 */

import { UsernameUtils, UserStore } from "@webpack/common";

import type { IdentityValues } from "./config";

export interface IdentityState extends IdentityValues {
    userId: string | null;
}

interface SavedIdentity {
    hadUsername: boolean;
    username: unknown;
    hadGlobalName: boolean;
    globalName: unknown;
}

const originals = new Map<string, SavedIdentity>();

let utilsPatched = false;
const originalUtilsFns: Record<string, (...args: any[]) => any> = {};

function findUser(userId: string): any {
    try {
        return UserStore?.getUser?.(userId) ?? null;
    } catch {
        return null;
    }
}

export function applyIdentity(state: IdentityState): void {
    restoreIdentity();
    if (!state.userId) return;

    const user = findUser(state.userId);
    if (!user) return;

    originals.set(state.userId, {
        hadUsername: Object.prototype.hasOwnProperty.call(user, "username"),
        username: user.username,
        hadGlobalName: Object.prototype.hasOwnProperty.call(user, "globalName"),
        globalName: user.globalName,
    });

    try {
        if (state.username) user.username = state.username;
    } catch {
        // Some Discord user objects are frozen; the UsernameUtils patches below
        // still cover the main rendering paths.
    }

    try {
        if (state.displayName) user.globalName = state.displayName;
    } catch {
        // Same as above.
    }
}

export function restoreIdentity(): void {
    for (const [userId, original] of originals) {
        const user = findUser(userId);
        if (!user) continue;

        try {
            if (original.hadUsername) {
                user.username = original.username;
            } else {
                delete user.username;
            }
        } catch {
            // Ignore frozen users.
        }

        try {
            if (original.hadGlobalName) {
                user.globalName = original.globalName;
            } else {
                delete user.globalName;
            }
        } catch {
            // Ignore frozen users.
        }
    }
    originals.clear();
}

function replaceUsername(text: string, userId: string, username: string): string {
    if (text.includes(username)) return text;

    const originalUsername = originals.get(userId)?.username;
    if (typeof originalUsername === "string" && originalUsername && text.includes(originalUsername)) {
        return text.replace(originalUsername, username);
    }

    return text;
}

export function installIdentityUtilsPatch(getState: () => IdentityState): void {
    if (utilsPatched) return;

    try {
        const utils: any = UsernameUtils;
        if (!utils) return;

        const patch = (method: string, build: (original: (...args: any[]) => any, state: IdentityState, user: any, args: any[]) => string | null) => {
            if (typeof utils[method] !== "function") return;

            originalUtilsFns[method] = utils[method];
            try {
                utils[method] = function (user: any, ...args: any[]) {
                    const state = getState();
                    const result = build(originalUtilsFns[method], state, user, args);
                    if (result != null) return result;
                    return originalUtilsFns[method].call(this, user, ...args);
                };
            } catch {
                delete originalUtilsFns[method];
            }
        };

        patch("getGlobalName", (_original, state, user) => {
            if (state.userId && user?.id === state.userId && state.displayName) {
                return state.displayName;
            }
            return null;
        });

        patch("getName", (original, state, user, _args) => {
            if (state.userId && user?.id === state.userId) {
                if (state.displayName) return state.displayName;
                // Only fall back to the username when Discord itself has no
                // display name (globalName) to show.
                if (state.username && !user.globalName) return state.username;
            }
            return null;
        });

        patch("getFormattedName", (original, state, user, args) => {
            if (!state.userId || user?.id !== state.userId || !state.username) return null;
            if (!args[0]) return null;

            const formatted = original.call(utils, user, ...args);
            return typeof formatted === "string"
                ? replaceUsername(formatted, state.userId, state.username)
                : null;
        });

        patch("getUserTag", (original, state, user, args) => {
            if (!state.userId || user?.id !== state.userId || !state.username) return null;

            const tag = original.call(utils, user, ...args);
            return typeof tag === "string"
                ? replaceUsername(tag, state.userId, state.username)
                : null;
        });

        utilsPatched = Object.keys(originalUtilsFns).length > 0;
    } catch {
        utilsPatched = false;
    }
}

export function uninstallIdentityUtilsPatch(): void {
    if (!utilsPatched) return;

    const utils: any = UsernameUtils;
    for (const [method, original] of Object.entries(originalUtilsFns)) {
        try {
            utils[method] = original;
        } catch {
            // Ignore.
        }
        delete originalUtilsFns[method];
    }
    utilsPatched = false;
}
