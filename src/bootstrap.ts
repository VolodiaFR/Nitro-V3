import { installSecureFetch, secureUrl } from './secure-assets';

installSecureFetch();

const setBootDebug = (message: string) =>
{
    try
    {
        (window as any).__nitroBootDebug = message;
        const secureNode = document.getElementById('nitro-secure-debug');

        if(secureNode) secureNode.textContent = `${ secureNode.textContent }\n${ message }`;
    }
    catch {}
};

setBootDebug('boot: secure fetch installed');

const search = new URLSearchParams(window.location.search);

(window as any).NitroSecureApiUrl = 'http://192.168.1.52:2096/';
(window as any).NitroConfig = {
    'config.urls': [
        secureUrl('config', 'renderer-config.json', true),
        secureUrl('config', 'ui-config.json', true)
    ],
    'sso.ticket': search.get('sso') || null,
    'forward.type': search.get('room') ? 2 : -1,
    'forward.id': search.get('room') || 0,
    'friend.id': search.get('friend') || 0
};

setBootDebug('boot: NitroConfig assigned');

import('./index')
    .then(() => setBootDebug('boot: app bundle imported'))
    .catch(error =>
    {
        setBootDebug(`boot: import failed ${ error?.message || error }`);
        throw error;
    });
