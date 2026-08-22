import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AIR camera viewfinder', () => {
    it('blits the room canvas into a viewfinder instead of showing HTML windows through a hole', () => {
        const source = readFileSync(join(process.cwd(), 'src/components/camera/views/CameraWidgetCaptureView.tsx'), 'utf8');

        expect(source).toContain('blitRoomCanvasToViewfinder');
        expect(source).toContain('getViewfinderRoomFrame');
        expect(source).toContain('<canvas');
        expect(source).toContain('nitro-camera-viewfinder');
        expect(source).not.toContain('getBoundingClientRect');
        expect(source).not.toContain('console.log');
    });
});
