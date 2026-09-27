import { LocalizeText } from '../utils/LocalizeText';

/** "user.ban" -> the localized "housekeeping.audit.action.user.ban", or the raw key when untranslated. */
export const localizeHousekeepingAction = (action: string): string => {
    const key = `housekeeping.audit.action.${action}`;
    const text = LocalizeText(key);

    return text && text !== key ? text : action;
};
