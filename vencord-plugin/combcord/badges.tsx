/**
 * Registers mock Discord badges through Vencord's Badges API.
 *
 * These are local visual replicas only. They are never sent to Discord and do
 * not grant any badge, achievement or privilege. They are shown only on the
 * current user's profile in this client.
 */

import { addProfileBadge, BadgePosition, removeProfileBadge } from "@api/Badges";
import type { ProfileBadge } from "@api/Badges";

import { badgeDataUrl, getMockBadge } from "./mockBadges";

export interface MockBadgeState {
    userId: string | null;
    enabled: boolean;
    ids: string[];
    showDisclaimer: boolean;
    originalUsername: string;
}

export function registerMockBadges(getState: () => MockBadgeState): () => void {
    const badge: ProfileBadge = {
        id: "combcord-mock-badges",
        key: "combcord-mock-badges",
        description: "CombCord mock Discord badges (local cosmetic replicas)",
        position: BadgePosition.END,
        getBadges: ({ userId }) => {
            const state = getState();
            if (!state.enabled || !state.userId || userId !== state.userId) return [];

            return state.ids.flatMap(id => {
                const mock = getMockBadge(id);
                if (!mock) return [];

                const disclaimer = state.showDisclaimer
                    ? " — visual replica for local display only. Not an official Discord badge or entitlement."
                    : "";

                // Custom handling for the "Originally Known As" badge
                let description = `${mock.label}${disclaimer}`;
                let alt = `${mock.label}${state.showDisclaimer ? " — mock badge, not official" : ""}`;

                if (mock.id === "originally_known_as" && state.originalUsername) {
                    description = `Originally known as: ${state.originalUsername}${disclaimer}`;
                    alt = `Originally known as: ${state.originalUsername}${state.showDisclaimer ? " — mock badge, not official" : ""}`;
                }

                return [{
                    id: `combcord-mock-${mock.id}`,
                    key: `combcord-mock-${mock.id}`,
                    description,
                    iconSrc: badgeDataUrl(mock.svg),
                    position: BadgePosition.END,
                    props: {
                        alt,
                    },
                } satisfies ProfileBadge];
            });
        },
    };

    addProfileBadge(badge);

    return () => {
        removeProfileBadge(badge);
    };
}
