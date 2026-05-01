import { FC, FormEvent, useCallback, useState } from 'react';
import { TurnstileWidget } from '../TurnstileWidget';
import { t } from '../utils/i18n';
import { DialogSharedProps } from './shared';

export interface ForgotDialogProps extends DialogSharedProps
{
    onSubmit: (body: { email: string; turnstileToken: string; }, onDialogReset: () => void) => void;
}

export const ForgotDialog: FC<ForgotDialogProps> = props =>
{
    const { onCancel, onSubmit, submitting, error, info, turnstileEnabled, turnstileSiteKey } = props;
    const [ email, setEmail ] = useState('');
    const [ localError, setLocalError ] = useState<string | null>(null);
    const [ turnstileToken, setTurnstileToken ] = useState('');
    const [ resetSignal, setResetSignal ] = useState(0);

    const resetWidget = useCallback(() =>
    {
        setTurnstileToken('');
        setResetSignal(prev => prev + 1);
    }, []);

    const handle = (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        setLocalError(null);

        if(!email.trim())
        {
            setLocalError(t('nitro.login.error.missing_email', 'Please enter your email address.'));
            return;
        }

        onSubmit({ email: email.trim(), turnstileToken }, resetWidget);
    };

    return (
        <div className="nitro-login-modal">
            <div className="dialog">
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span>{ t('nitro.login.forgot.title', 'Reset password') }</span>
                        <span className="nitro-card-close-button" role="button" aria-label={ t('generic.close', 'Close') } onClick={ onCancel } />
                    </div>
                    <form className="card-body" onSubmit={ handle } autoComplete="on">
                        <div className="field">
                            <label htmlFor="forgot-email">{ t('nitro.login.forgot.email.label', 'Email address') }</label>
                            <input id="forgot-email" type="email" maxLength={ 120 } autoComplete="email"
                                value={ email } onChange={ e => setEmail(e.target.value) } />
                        </div>
                        { turnstileEnabled &&
                            <TurnstileWidget
                                siteKey={ turnstileSiteKey }
                                size="compact"
                                onToken={ setTurnstileToken }
                                onExpire={ () => setTurnstileToken('') }
                                onError={ () => setTurnstileToken('') }
                                resetSignal={ resetSignal }
                            /> }
                        { (localError || error) && <div className="error-line">{ localError || error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button type="submit" className="ok-button" disabled={ submitting }>{ t('nitro.login.forgot.send', 'Send email') }</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
