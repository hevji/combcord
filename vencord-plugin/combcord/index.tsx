import { addMemberListDecorator, removeMemberListDecorator } from "@api/MemberListDecorators";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { SelectedGuildStore, UserStore } from "@webpack/common";

import { registerMockBadges } from "./badges";
import { accentToInts, getAppearance, getIdentity, getMockBadgeIds, getServerTag, type CombCordSettings } from "./config";
import { buildAppearanceCss } from "./css";
import { settings } from "./settings";
import { state } from "./state";
import { startProfileTagger, stopProfileTagger, rescanProfiles } from "./tagger";
import { applyIdentity, installIdentityUtilsPatch, restoreIdentity, uninstallIdentityUtilsPatch } from "./usernames";
import { VERSION } from "./version";

const logger = new Logger("CombCord");
const STYLE_ID = "combcord-plugin-style";

let unregisterBadges: (() => void) | null = null;
let profileCache = new WeakMap<object, unknown>();
let currentUserId: string | null = null;

function getCurrentUserId(): string | null {
    try {
        const user = UserStore?.getCurrentUser?.();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

function refreshCurrentUser(): void {
    currentUserId = getCurrentUserId();
}

function refreshStyle(): void {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }

    const s = settings.store as unknown as CombCordSettings;
    const appearance = getAppearance(s, currentUserId);
    const css = buildAppearanceCss(appearance);
    if (style.textContent !== css) style.textContent = css;
}

function applyConfig(): void {
    refreshCurrentUser();

    const s = settings.store as unknown as CombCordSettings;

    // Identity
    const identity = getIdentity(s, currentUserId);
    applyIdentity({
        userId: currentUserId,
        username: identity.username ?? "",
        displayName: identity.displayName ?? "",
    });

    // Badges are handled by the dynamic getBadges in badges.tsx

    // Appearance CSS
    const appearance = getAppearance(s, currentUserId);
    refreshStyle();
    rescanProfiles();

    logger.info("CombCord config applied", {
        userId: currentUserId,
        username: identity.username,
        displayName: identity.displayName,
        mockBadges: getMockBadgeIds(s, currentUserId).length,
        appearance: !!appearance,
    });
}

export default definePlugin({
    name: "CombCord",
    description: "Customize your own Discord profile: username, display name, mock badges, accent colors, avatar frames, and decorations. All changes are local to this client.",
    authors: [{ name: "CombCord", id: 0n }],
    tags: ["Appearance", "Customisation"],
    settings,

    patches: [
        // Message author names (same anchor as Vencord's ShowMeYourName).
        // eslint-disable-next-line no-useless-escape
        {
            find: '="SYSTEM_TAG"',
            replacement: {
                match: /(?<=onContextMenu:\i,children:)\i\?(?=.{0,100}?user[Nn]ame:)/,
                replace: "$self.renderMessageUsername(arguments[0]),_oldChildren:$&",
            },
        },
        // Profile theme colors (same anchor as Vencord's FakeProfileThemes).
        // eslint-disable-next-line no-useless-escape
        {
            find: "UserProfileStore",
            replacement: {
                match: /(?<=getUserProfile\(\i\){return )(.+?)(?=})/,
                replace: "$self.profileHook($1)",
            },
        },
    ],

    flux: {
        CONNECTION_OPEN: () => { applyConfig(); },
        USER_UPDATE: () => { applyConfig(); },
        GUILD_MEMBER_UPDATE: () => { applyConfig(); },
    },

    start() {
        try {
            logger.info(`CombCord v${VERSION} starting`);
            state.reload = applyConfig;
            refreshCurrentUser();

            // Badges
            unregisterBadges = registerMockBadges(() => {
                try {
                    const s = settings.store as unknown as CombCordSettings;
                    return {
                        userId: currentUserId,
                        enabled: s?.mockBadgesEnabled ?? false,
                        ids: getMockBadgeIds(s, currentUserId),
                        showDisclaimer: s?.mockBadgesShowDisclaimer ?? true,
                        originalUsername: s?.originalUsername ?? "",
                    };
                } catch {
                    return { userId: currentUserId, enabled: false, ids: [], showDisclaimer: true, originalUsername: "" };
                }
            });

            // Username/DisplayName patches
            installIdentityUtilsPatch(() => {
                try {
                    const s = settings.store as unknown as CombCordSettings;
                    const identity = getIdentity(s, currentUserId);
                    return {
                        userId: currentUserId,
                        username: identity.username ?? "",
                        displayName: identity.displayName ?? "",
                    };
                } catch {
                    return { userId: currentUserId, username: "", displayName: "" };
                }
            });

            // Custom server tag in the member list of the selected server.
            addMemberListDecorator("combcord-server-tag", ({ user, type }) => {
                try {
                    if (type !== "guild" || !user || user.id !== currentUserId) return null;

                    const s = settings.store as unknown as CombCordSettings;
                    const guildId = SelectedGuildStore?.getGuildId?.();
                    const tag = getServerTag(s, guildId);
                    if (!tag) return null;

                    return (
                        <span
                            className="combcord-server-tag"
                            style={{
                                marginLeft: 6,
                                padding: "0 5px",
                                borderRadius: 4,
                                border: "1px solid var(--brand-500, #5865f2)",
                                color: "var(--brand-360, #c9cdfb)",
                                fontSize: 10,
                                fontWeight: 600,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: 0.3,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tag}
                        </span>
                    );
                } catch {
                    return null;
                }
            }, "guilds");

            startProfileTagger();
            applyConfig();
            logger.info("CombCord started");
        } catch (err) {
            logger.error("CombCord start failed:", err);
        }
    },

    stop() {
        restoreIdentity();
        uninstallIdentityUtilsPatch();
        unregisterBadges?.();
        unregisterBadges = null;
        try {
            removeMemberListDecorator("combcord-server-tag");
        } catch { /* already gone */ }
        stopProfileTagger();
        document.getElementById(STYLE_ID)?.remove();
        currentUserId = null;
        state.reload = () => {};
        logger.info("CombCord stopped");
    },

    /** Called from the message-username patch. Must not use hooks. */
    renderMessageUsername(props: any) {
        if (!currentUserId) {
            const fallback =
                props?.author?.nick ??
                props?.message?.author?.globalName ??
                props?.message?.author?.username ??
                "";
            const prefix = props?.withMentionPrefix ? "@" : "";
            return <>{prefix}{fallback}</>;
        }

        const s = settings.store as unknown as CombCordSettings;
        const identity = getIdentity(s, currentUserId);
        const authorId = props?.author?.authorId ?? props?.message?.author?.id;

        if (authorId !== currentUserId) {
            // Other users: use Discord's default (nick > globalName > username)
            const fallback =
                props?.author?.nick ??
                props?.message?.author?.globalName ??
                props?.message?.author?.username ??
                "";
            const prefix = props?.withMentionPrefix ? "@" : "";
            return <>{prefix}{fallback}</>;
        }

        const prefix = props?.withMentionPrefix ? "@" : "";

        // For our own messages: display name takes priority, then username if no globalName
        if (identity.displayName) {
            return <>{prefix}{identity.displayName}</>;
        }
        if (identity.username && !props?.message?.author?.globalName && !props?.author?.nick) {
            return <>{prefix}{identity.username}</>;
        }

        // Fallback to Discord's default
        const fallback =
            props?.author?.nick ??
            props?.message?.author?.globalName ??
            props?.message?.author?.username ??
            "";

        return <>{prefix}{fallback}</>;
    },

    /** Called from the profile-store patch. Must not use hooks. */
    profileHook(profile: any) {
        try {
            if (!currentUserId || !profile) return profile;

            const s = settings.store as unknown as CombCordSettings;
            const userId = profile.userId ?? profile.user?.id;
            if (!userId || userId !== currentUserId) return profile;

            const appearance = getAppearance(s, userId);
            if (!appearance) return profile;

            const colors = accentToInts(appearance.accentColor);
            if (!colors) return profile;

            const cached = profileCache.get(profile);
            if (cached) return cached;

            // Identity overrides for memberSince
            const identity = getIdentity(s, currentUserId);
            let customMemberSince = undefined;
            if (identity.memberSince) {
                const date = new Date(identity.memberSince + "T00:00:00");
                if (!isNaN(date.getTime())) customMemberSince = date;
            }

            // FakeProfileThemes uses the same trick: non-nitro profiles need
            // premiumType 2 for Discord to render themeColors.
            const merged = {
                ...profile,
                premiumType: profile.premiumType || 2,
                themeColors: colors,
                accentColor: colors[1],
                memberSince: customMemberSince ?? profile.memberSince,
            };
            profileCache.set(profile, merged);
            return merged;
        } catch {
            return profile;
        }
    },
});

export { applyConfig };