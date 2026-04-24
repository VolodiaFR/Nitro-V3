# Secure runtime modes

Questa doc riassume tutti i dati da impostare per:

- offuscamento bundle `dist` (`app.js` / `app.css` → `.dat`)
- secure assets runtime (`renderer-config.json`, `ui-config.json`, `gamedata`)
- secure API runtime (`/api/*`)
- fallback plain quando vuoi spegnere tutto senza togliere il codice

## 1. `Nitro-V3/public/client-mode.json`

Questo file controlla tutto a runtime.

```json
{
    "distObfuscationEnabled": true,
    "secureAssetsEnabled": true,
    "secureApiEnabled": true,
    "apiBaseUrl": "https://nitro.slogga.it:2096",
    "plainConfigBaseUrl": "https://hotel.slogga.it/",
    "plainGamedataBaseUrl": "https://hotel.slogga.it/client/nitro/gamedata/"
}
```

### Campi

- `distObfuscationEnabled`
  - `true`: `asset-loader.js` carica `app.css.dat` e `app.js.dat`
  - `false`: carica i file normali `assets/app.css` e `assets/app.js`

- `secureAssetsEnabled`
  - `true`: `bootstrap.ts` e `secure-assets.ts` usano `/nitro-sec/file`
  - `false`: `renderer-config.json`, `ui-config.json` e gamedata vengono letti in plain

- `secureApiEnabled`
  - `true`: il wrapper `fetch` cifra le chiamate `/api/*`
  - `false`: le chiamate `/api/*` restano normali

- `apiBaseUrl`
  - base URL dell’emulatore / API Nitro
  - esempio: `https://nitro.slogga.it:2096`
  - meglio valorizzarlo sempre, così non dipendi dal fallback hardcoded

- `plainConfigBaseUrl`
  - base URL dei file config plain
  - normalmente: `https://hotel.slogga.it/`

- `plainGamedataBaseUrl`
  - base URL del gamedata plain
  - normalmente: `https://hotel.slogga.it/client/nitro/gamedata/`

## 2. `Nitro-V3/src/bootstrap.ts`

`bootstrap.ts`:

- installa il secure fetch wrapper
- legge `window.__nitroClientMode`
- costruisce `NitroConfig['config.urls']`

### Comportamento attuale

- se `secureAssetsEnabled=true`
  - usa `secureUrl('config', 'renderer-config.json', true)`
  - usa `secureUrl('config', 'ui-config.json', true)`

- se `secureAssetsEnabled=false`
  - usa i file plain con cache bust (`?v=...`)

### Nota importante

Il fallback attuale è:

```ts
(window as any).NitroSecureApiUrl = clientMode.apiBaseUrl || 'http://192.168.1.52:2096/';
```

Quindi in produzione conviene sempre valorizzare `apiBaseUrl` dentro `client-mode.json`.

## 3. `Nitro-V3/src/secure-assets.ts`

Qui vive tutta la logica runtime:

- bootstrap ECDH
- decrypt/encrypt assets
- secure `/api/*`
- fallback plain quando i toggle sono spenti

### In pratica

- legge i flag da `window.__nitroClientMode`
- se `secureAssetsEnabled=false`
  - converte automaticamente `/nitro-sec/file?...` in URL plain
- se `secureApiEnabled=false`
  - non cifra `/api/*`

Normalmente non serve toccarlo, a meno che tu non voglia cambiare il protocollo secure.

## 4. `Nitro-V3/public/renderer-config.json`

Questo file continua a definire i path usati dal renderer.

### Da controllare

- `api.url`
- `socket.url`
- `gamedata.url`
- `external.texts.url`
- `external.texts.translation.url`
- `furnidata.url`
- `furnidata.translation.url`

### Con secure assets attivo

Puoi usare:

```json
"gamedata.url": "https://nitro.slogga.it:2096/nitro-sec/file?kind=gamedata&file="
```

e gli altri URL secure equivalenti.

### Con secure assets disattivo

Conviene usare i path plain classici, per esempio:

```json
"gamedata.url": "https://hotel.slogga.it/client/nitro/gamedata"
```

oppure lasciare il renderer configurato com’è e demandare il fallback a `secure-assets.ts`.

## 5. `Nitro-V3/public/ui-config.json`

Qui non c’è logica secure, ma è uno dei file caricati da `config.urls`.

Se `secureAssetsEnabled=true`, arriva da `/nitro-sec/file`.
Se `secureAssetsEnabled=false`, arriva dal file statico con `?v=...`.

Quindi basta mantenerlo corretto come contenuto, non serve altro.

## 6. `Nitro-V3/scripts/write-asset-loader.mjs`

Questo script genera `public/asset-loader.js`.

### Cosa fa ora

- mostra la shell iniziale
- legge `client-mode.json`
- decide se caricare:
  - `app.css.dat` / `app.js.dat`
  - oppure `assets/app.css` / `assets/app.js`

### Importante

Se modifichi questo script, il loader aggiornato viene rigenerato al prossimo:

```bash
yarn build
```

perché in `package.json` c’è:

```json
"prebuild": "node scripts/write-asset-loader.mjs"
```

## 7. `Nitro-V3/scripts/minify-dist.mjs`

Adesso questo script:

- genera i `.dat`
- lascia anche i file originali `app.css` e `app.js`

Questa parte è fondamentale, altrimenti il toggle `distObfuscationEnabled=false` non avrebbe fallback.

## 8. `Arcturus-Morningstar-Extended/Latest_Compiled_Version/config.ini.example`

I flag backend attuali sono:

```ini
nitro.secure.assets.enabled=true
nitro.secure.api.enabled=true
nitro.secure.config.root=
nitro.secure.gamedata.root=
nitro.secure.master_key=change-me-to-a-long-random-secret
```

### Significato

- `nitro.secure.assets.enabled`
  - abilita `/nitro-sec/bootstrap` e `/nitro-sec/file`

- `nitro.secure.api.enabled`
  - abilita il layer secure per `/api/*`

- `nitro.secure.config.root`
  - cartella dove leggere `renderer-config.json` e `ui-config.json`

- `nitro.secure.gamedata.root`
  - cartella dove leggere il gamedata live

- `nitro.secure.master_key`
  - segreto persistente lato server
  - necessario soprattutto con Cloudflare / richieste multiple

## 9. Esempi di configurazione

### Tutto attivo

`client-mode.json`

```json
{
    "distObfuscationEnabled": true,
    "secureAssetsEnabled": true,
    "secureApiEnabled": true,
    "apiBaseUrl": "https://nitro.slogga.it:2096",
    "plainConfigBaseUrl": "https://hotel.slogga.it/",
    "plainGamedataBaseUrl": "https://hotel.slogga.it/client/nitro/gamedata/"
}
```

`config.ini`

```ini
nitro.secure.assets.enabled=true
nitro.secure.api.enabled=true
nitro.secure.config.root=C:/inetpub/wwwroot/paxxo/nitro
nitro.secure.gamedata.root=C:/inetpub/wwwroot/paxxo/nitro/client/nitro/gamedata
nitro.secure.master_key=una-chiave-lunga-random
```

### Solo `.dat`, senza secure assets/api

`client-mode.json`

```json
{
    "distObfuscationEnabled": true,
    "secureAssetsEnabled": false,
    "secureApiEnabled": false,
    "apiBaseUrl": "https://nitro.slogga.it:2096",
    "plainConfigBaseUrl": "https://hotel.slogga.it/",
    "plainGamedataBaseUrl": "https://hotel.slogga.it/client/nitro/gamedata/"
}
```

`config.ini`

```ini
nitro.secure.assets.enabled=false
nitro.secure.api.enabled=false
```

### Tutto plain

`client-mode.json`

```json
{
    "distObfuscationEnabled": false,
    "secureAssetsEnabled": false,
    "secureApiEnabled": false,
    "apiBaseUrl": "https://nitro.slogga.it:2096",
    "plainConfigBaseUrl": "https://hotel.slogga.it/",
    "plainGamedataBaseUrl": "https://hotel.slogga.it/client/nitro/gamedata/"
}
```

## 10. Quando serve rebuild

### Non serve rebuild

Per cambiare:

- `client-mode.json`
- `renderer-config.json`
- `ui-config.json`
- gamedata live
- `config.ini`

### Serve rebuild

Per cambiare:

- `src/bootstrap.ts`
- `src/secure-assets.ts`
- `scripts/write-asset-loader.mjs`
- `scripts/minify-dist.mjs`

## 11. Nota pratica deployment

Per usare bene i toggle:

- pubblica sempre sia i file plain sia i `.dat`
- assicurati che IIS/host serva il MIME type per `.dat`
- se spegni il secure mode nel client, spegnilo anche nel backend per coerenza

## 12. Checklist veloce

- `client-mode.json` configurato
- `apiBaseUrl` corretto
- `nitro.secure.master_key` valorizzata
- `nitro.secure.config.root` corretto
- `nitro.secure.gamedata.root` corretto
- `.dat` e file plain entrambi deployati
- MIME `.dat` presente sul web server
