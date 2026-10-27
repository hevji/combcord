/**
 * Small bridge between the settings component and the plugin instance to avoid
 * a circular import.
 */
export const state: {
    reload: () => void;
} = {
    reload: () => {},
};

let timer: ReturnType<typeof setTimeout> | null = null;

export function requestReload(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        state.reload();
    }, 250);
}