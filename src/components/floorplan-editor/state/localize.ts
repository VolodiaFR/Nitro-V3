import { LocalizeText } from '../../../api';

/**
 * Looks a text key up and falls back to `fallback` when the external texts do
 * not carry it. The renderer returns the key itself for unknown keys, which
 * is what would otherwise end up on screen.
 */
export const localizeOr = (key: string, fallback: string, parameters: string[] = null, replacements: string[] = null): string => {
    const value = LocalizeText(key, parameters, replacements);

    return !value || value === key ? fallback : value;
};
