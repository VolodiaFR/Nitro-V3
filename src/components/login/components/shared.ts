export interface DialogSharedProps
{
    onCancel: () => void;
    submitting: boolean;
    error: string | null;
    info: string | null;
    turnstileEnabled: boolean;
    turnstileSiteKey: string;
}
