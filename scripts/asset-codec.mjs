const KEY = new TextEncoder().encode('slogga-dist-assets-2026');

export const encodeBytes = bytes =>
{
    const output = new Uint8Array(bytes.length);

    for(let index = 0; index < bytes.length; index++)
    {
        output[index] = bytes[index] ^ KEY[index % KEY.length] ^ ((index * 31) & 255);
    }

    return output;
};
