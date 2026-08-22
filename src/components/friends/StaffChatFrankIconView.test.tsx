/* @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STAFF_CHAT_FRANK_HABBICON_ID, STAFF_CHAT_FRANK_SPRITE, StaffChatFrankIconView } from './StaffChatFrankIconView';

vi.mock('../../api/habbicons/habbiconCatalog', () => ({ getHabbiconsBaseUrl: () => '/habbicons/default/' }));

afterEach(cleanup);

describe('Staff Chat Frank icon', () => {
    it('matches the neutral Frank entry in the bundled Habbicon catalog', () => {
        const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public/habbicons/default/habbicons.json'), 'utf8'));
        const frank = catalog.habbicons.find((entry: { id: number }) => entry.id === STAFF_CHAT_FRANK_HABBICON_ID);

        expect(frank).toMatchObject({
            name: 'frank_frank',
            x: STAFF_CHAT_FRANK_SPRITE.x,
            y: STAFF_CHAT_FRANK_SPRITE.y,
            width: STAFF_CHAT_FRANK_SPRITE.cellSize,
            height: STAFF_CHAT_FRANK_SPRITE.cellSize
        });
    });

    it.each([
        { size: 20, sheetSize: '120px 120px', position: '-80px -60px' },
        { size: 35, sheetSize: '210px 210px', position: '-140px -105px' },
        { size: 40, sheetSize: '240px 240px', position: '-160px -120px' }
    ])('renders the $size px face at exact sprite coordinates', ({ size, sheetSize, position }) => {
        const { container } = render(<StaffChatFrankIconView size={size} />);
        const frank = container.querySelector<HTMLElement>('.staff-chat-frank-icon');

        expect(frank).not.toBeNull();
        expect(frank?.style.width).toBe(`${size}px`);
        expect(frank?.style.height).toBe(`${size}px`);
        expect(frank?.style.backgroundImage).toContain('/habbicons/default/habbicons_spritesheet.png');
        expect(frank?.style.backgroundPosition).toBe(position);
        expect(frank?.style.backgroundSize).toBe(sheetSize);
        expect(frank?.style.imageRendering).toBe('pixelated');
    });
});
