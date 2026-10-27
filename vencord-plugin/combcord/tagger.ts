/**
 * Tags open profile popouts/modals with the Discord user id they belong to.
 *
 * Discord does not expose the user id in the DOM, so we read it from the React
 * fiber props of the profile container. The attribute is then used by the
 * generated CSS to scope appearance overrides to the right person, and to
 * locate the "Member Since" row for the local date override.
 *
 * This is intentionally best-effort: if a Discord update changes the component
 * structure, profiles simply stay untagged and no overrides are applied.
 */

import { UserStore } from "@webpack/common";

import { getIdentity, type CombCordSettings } from "./config";
import { settings } from "./settings";

const PROFILE_SELECTOR = [
    '[class*="userPopout"]',
    '[class*="userProfileModal"]',
    '[class*="user-profile-modal"]',
    '[class*="profileContentOuter"]',
    '[class*="profilePanel"]',
    '[class*="profileModal"]',
].join(",");

const TAG_ATTR = "data-combcord-user-id";
const ORIGINAL_TEXT_ATTR = "data-combcord-original-member-since";
const SNOWFLAKE_RE = /^\d{17,20}$/;
const MEMBER_SINCE_LABEL = /^member\s*since$/i;

let observer: MutationObserver | null = null;
let pending = false;

function getFiber(node: Element): any {
    const key = Object.keys(node).find(k =>
        k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
    );
    return key ? (node as any)[key] : null;
}

function userIdFromProps(props: any): string | null {
    if (!props || typeof props !== "object") return null;

    const candidates = [
        props.userId,
        props.user?.id,
        props.author?.id,
        props.message?.author?.id,
        props.displayProfile?.userId,
        props.profile?.userId,
        props.participantUser?.id,
        props.member?.userId,
        props.user?.user?.id,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && SNOWFLAKE_RE.test(candidate)) return candidate;
    }
    return null;
}

function userIdFromNode(node: Element): string | null {
    let fiber = getFiber(node);
    for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
        const id = userIdFromProps(fiber.memoizedProps) ?? userIdFromProps(fiber.pendingProps);
        if (id) return id;
    }
    return null;
}

function tagProfile(root: Element): void {
    if (root.hasAttribute(TAG_ATTR)) return;

    // Do not tag a nested profile element if an ancestor is already tagged.
    if (root.parentElement?.closest(`[${TAG_ATTR}]`)) return;

    let id = userIdFromNode(root);

    if (!id) {
        // The user id often lives on a child component, not the modal root.
        const children = root.querySelectorAll("*");
        const limit = Math.min(children.length, 300);
        for (let i = 0; i < limit && !id; i++) {
            id = userIdFromNode(children[i]);
        }
    }

    if (id) {
        root.setAttribute(TAG_ATTR, id);
        root.setAttribute("data-combcord-profile", "true");
    }
}

function formatMemberSince(value: string): string | null {
    const date = new Date(value + "T00:00:00");
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Matches dates like "21 Apr 2025", "Apr 21, 2025", "2025-04-21". */
const DATE_TEXT_RE = /\b\d{1,2}[\s./-][A-Za-z]{3,9}[\s./-]\d{2,4}\b|\b[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}\b|\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/;

let warnedMissingDate = false;

/** Returns the element in a "Member Since" section that holds the date. */
function findDateElement(section: Element): HTMLElement | null {
    const nodes = section.querySelectorAll("*");
    let fallback: HTMLElement | null = null;
    let container: HTMLElement | null = null;

    for (const node of Array.from(nodes) as HTMLElement[]) {
        const text = (node.textContent ?? "").trim();
        if (!text || MEMBER_SINCE_LABEL.test(text)) continue;

        if (node.children.length === 0) {
            if (DATE_TEXT_RE.test(text)) return node;
            if (!fallback) fallback = node;
        } else if (DATE_TEXT_RE.test(text)) {
            container = node;
        }
    }

    return fallback ?? container;
}

function restoreMemberSince(section: Element): void {
    for (const el of Array.from(section.querySelectorAll<HTMLElement>(`[${ORIGINAL_TEXT_ATTR}]`))) {
        el.textContent = el.getAttribute(ORIGINAL_TEXT_ATTR) ?? el.textContent;
        el.removeAttribute(ORIGINAL_TEXT_ATTR);
    }
}

/**
 * Replaces the rendered "Member Since" date on our own profile. Discord derives
 * the date from the account snowflake at render time and the value is not
 * exposed as a prop, so a scoped text swap is the reliable client-side override
 * across profile modal versions.
 */
function applyMemberSince(section: Element, userId: string): void {
    try {
        const s = settings.store as unknown as CombCordSettings;
        const identity = getIdentity(s, userId);
        const formatted = identity.memberSince ? formatMemberSince(identity.memberSince) : null;

        if (!formatted) {
            restoreMemberSince(section);
            return;
        }

        const target = findDateElement(section);
        if (!target) {
            if (!warnedMissingDate) {
                warnedMissingDate = true;
                console.warn("[CombCord] Found your Member Since section but no date element inside it.");
            }
            return;
        }

        if (!target.hasAttribute(ORIGINAL_TEXT_ATTR)) {
            target.setAttribute(ORIGINAL_TEXT_ATTR, target.textContent ?? "");
        }

        if (target.textContent !== formatted) {
            target.textContent = formatted;
        }
    } catch {
        // Best-effort only; never break profile rendering.
    }
}

/** Applies the override to every "Member Since" section that belongs to us. */
function scanMemberSince(me: string): void {
    for (const label of Array.from(document.querySelectorAll("h1,h2,h3,h4,h5"))) {
        if (!MEMBER_SINCE_LABEL.test((label.textContent ?? "").trim())) continue;

        const section = label.closest("section") ?? label.parentElement?.parentElement ?? label.parentElement;
        if (!section) continue;

        const id = userIdFromNode(section);
        if (id && id === me) applyMemberSince(section, id);
    }
}

function currentUserId(): string | null {
    try {
        return UserStore?.getCurrentUser?.()?.id ?? null;
    } catch {
        return null;
    }
}

function scan(): void {
    pending = false;
    if (!document.body) return;

    const me = currentUserId();

    for (const element of Array.from(document.querySelectorAll(PROFILE_SELECTOR))) {
        tagProfile(element);
    }

    if (me) scanMemberSince(me);
}

function scheduleScan(): void {
    if (pending) return;
    pending = true;
    setTimeout(scan, 40);
}

/** Re-runs the scan after a settings change (no DOM mutation may have happened). */
export function rescanProfiles(): void {
    scheduleScan();
}

export function startProfileTagger(): void {
    if (observer) return;
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scheduleScan();
}

export function stopProfileTagger(): void {
    observer?.disconnect();
    observer = null;
    for (const element of Array.from(document.querySelectorAll(`[${TAG_ATTR}]`))) {
        element.removeAttribute(TAG_ATTR);
        element.removeAttribute("data-combcord-profile");
    }
    for (const element of Array.from(document.querySelectorAll<HTMLElement>(`[${ORIGINAL_TEXT_ATTR}]`))) {
        element.textContent = element.getAttribute(ORIGINAL_TEXT_ATTR) ?? element.textContent;
        element.removeAttribute(ORIGINAL_TEXT_ATTR);
    }
}
