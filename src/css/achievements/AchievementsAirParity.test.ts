import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

const css = readSource('src/css/achievements/AchievementsView.css');
const viewSource = readSource('src/components/achievements/AchievementsView.tsx');
const categoryListSource = readSource('src/components/achievements/category-list/AchievementsCategoryListView.tsx');
const categoryItemSource = readSource('src/components/achievements/category-list/AchievementsCategoryListItemView.tsx');
const achievementListSource = readSource('src/components/achievements/achievement-list/AchievementListView.tsx');
const categoryViewSource = readSource('src/components/achievements/AchievementCategoryView.tsx');
const detailsSource = readSource('src/components/achievements/AchievementDetailsView.tsx');
const utilitiesSource = readSource('src/api/achievements/AchievementUtilities.ts');
const nitroCardSource = readSource('src/layout/NitroCard.tsx');

describe('AIR achievements window parity', () => {
    it('uses the 389px frame, 33px chrome, AIR top position, and dynamic-height content stack', () => {
        expect(css).toMatch(/\.nitro-card-shell\.nitro-achievements-air\s*\{[^}]*width:\s*389px\s*!important;/s);
        expect(css).toMatch(/\.nitro-achievements-air > \.nitro-card-header-shell\s*\{[^}]*height:\s*33px\s*!important;/s);
        expect(css).toMatch(/\.air-achievements-content\.nitro-card-content-shell\s*\{[^}]*padding:\s*0 0 12px\s*!important;[^}]*gap:\s*4px;/s);
        expect(viewSource).toContain('windowPosition={DraggableWindowPosition.TOP_CENTER}');
        expect(viewSource).toContain('offsetTop={-30}');
        expect(nitroCardSource).toContain('offsetTop={offsetTop}');
        expect(viewSource).not.toContain('w-[375px] h-[405px]');
    });

    it('renders the AIR three-column category sheet with nine minimum slots', () => {
        expect(categoryListSource).toContain('Math.max(9, categories?.length ?? 0)');
        expect(css).toMatch(/\.air-achievements-categories\s*\{[^}]*width:\s*371px;[^}]*margin-left:\s*19px;[^}]*padding-top:\s*6px;/s);
        expect(css).toMatch(/grid-template-columns:\s*repeat\(3, 112px\);/);
        expect(css).toMatch(/grid-auto-rows:\s*105px;/);
        expect(css).toMatch(/column-gap:\s*8px;/);
        expect(css).toMatch(/row-gap:\s*5px;/);
        expect(categoryItemSource).toContain("getAchievementImageUrl('achievement_bkg_active1')");
        expect(categoryItemSource).toContain("getAchievementImageUrl('achievement_bkg_active2')");
    });

    it('matches the selected-category 75px banner coordinates', () => {
        expect(css).toMatch(/\.air-achievements-category-header\s*\{[^}]*width:\s*389px;[^}]*height:\s*75px;/s);
        expect(css).toMatch(/\.air-achievements-back\s*\{[^}]*top:\s*21px;[^}]*left:\s*14px;[^}]*width:\s*33px;[^}]*height:\s*34px;/s);
        expect(css).toMatch(/\.air-achievements-category-name\s*\{[^}]*top:\s*13px;[^}]*left:\s*78px;[^}]*font-size:\s*20px;/s);
        expect(css).toMatch(/\.air-achievements-category-icon\s*\{[^}]*top:\s*3px;[^}]*left:\s*297px;[^}]*width:\s*84px;[^}]*height:\s*72px;/s);
    });

    it('uses 62x60 achievement cells, six columns normally, and AIR five-column scrolling above 24', () => {
        expect(achievementListSource).toContain('const isScrollable = (achievements?.length ?? 0) > 24');
        expect(achievementListSource).toContain('Math.max(12, achievements?.length ?? 0)');
        expect(achievementListSource).toContain('isScrollable ? 5 : 6');
        expect(achievementListSource).toContain('is-scrollable has-classic-scrollbar');
        expect(categoryViewSource).toContain('useLayoutEffect');
        expect(css).toMatch(/\.air-achievements-list\s*\{[^}]*width:\s*367px;[^}]*margin-left:\s*10px;/s);
        expect(css).toMatch(/\.air-achievements-list\.is-scrollable\s*\{[^}]*height:\s*245px;/s);
        expect(css).toMatch(/\.air-achievement-tile\s*\{[^}]*width:\s*62px;[^}]*height:\s*60px;/s);
        expect(css).toMatch(/\.air-achievement-tile-badge\s*\{[^}]*top:\s*10px\s*!important;[^}]*left:\s*11px\s*!important;/s);
    });

    it('pins the 360x129 details panel and its large badge, copy, level, reward, and progress', () => {
        expect(css).toMatch(/\.air-achievement-details\s*\{[^}]*width:\s*360px;[^}]*height:\s*129px;[^}]*margin-left:\s*15px;/s);
        expect(css).toMatch(/\.air-achievement-details-badge\s*\{[^}]*top:\s*12px;[^}]*left:\s*10px;[^}]*width:\s*85px;[^}]*height:\s*85px;/s);
        expect(css).toMatch(/\.air-achievement-details-name\s*\{[^}]*top:\s*18px;[^}]*left:\s*114px;[^}]*width:\s*238px;/s);
        expect(css).toMatch(/\.air-achievement-details-description\s*\{[^}]*top:\s*34px;[^}]*height:\s*47px;/s);
        expect(css).toMatch(/\.air-achievement-details-level\s*\{[^}]*top:\s*97px;[^}]*left:\s*4px;[^}]*width:\s*95px;/s);
        expect(css).toMatch(/\.air-achievement-details-progress\s*\{[^}]*top:\s*93px;[^}]*left:\s*115px;/s);
        expect(detailsSource).toContain('width={180}');
    });

    it('follows AIR reward, progress, badge-level, and exact progress-bar asset rules', () => {
        expect(detailsSource).toContain('!achievement.finalLevel && achievement.levelRewardPointType >= 0 && achievement.levelRewardPoints > 0');
        expect(detailsSource).toContain('achievement.displayMethod !== AchievementData.DISPLAY_METHOD_NEVER_SHOW_PROGRESS && !achievement.finalLevel');
        expect(detailsSource).toContain('progress={achievement.currentPoints}');
        expect(detailsSource).toContain('maxProgress={achievement.scoreLimit}');
        expect(utilitiesSource).toContain('achievement.levelCount > 1 && !achievement.finalLevel');
        expect(achievementListSource).toContain('0.768627451 0 0 0 0');
        expect(achievementListSource).toContain('0 0 0.498039216 0 0');
        expect(css).toContain("filter: url('#air-achievement-unseen-tint')");
        for (let index = 1; index <= 5; index++) {
            expect(readSource('src/components/achievements/AirAchievementProgressBar.tsx')).toContain(`getAchievementImageUrl('ach_progressbar${index}')`);
        }
        expect(css).toMatch(/\.air-achievement-progress__fill-background\s*\{[^}]*background:\s*#ffff00;/s);
    });
});
