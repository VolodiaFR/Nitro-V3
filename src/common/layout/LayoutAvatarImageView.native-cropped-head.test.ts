import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LayoutAvatarImageView native cropped heads', () => {
    it('uses the renderer union crop without compact resampling', () => {
        const source = readFileSync(resolve(process.cwd(), 'src/common/layout/LayoutAvatarImageView.tsx'), 'utf8');

        expect(source).toMatch(/nativeCroppedHead\?:\s*boolean/);
        expect(source).toMatch(/nativeCroppedHead\s*\?\s*avatarImage\.processAsCroppedImageUrl\(setType\)/);
        expect(source).toMatch(/fit\s*&&\s*!nativeCroppedHead/);
        expect(source).toMatch(/width:\s*'auto'[\s\S]*maxWidth:\s*'none'[\s\S]*height:\s*'auto'/);
        expect(source).not.toMatch(/nativeCroppedHead\)[^\n]*cropTransparentImageUrl/);
    });
});
