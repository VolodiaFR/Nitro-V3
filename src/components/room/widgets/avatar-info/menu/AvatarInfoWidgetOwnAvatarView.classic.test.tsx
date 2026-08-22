import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvatarInfoWidgetOwnAvatarView } from './AvatarInfoWidgetOwnAvatarView';

const { createLinkEventMock } = vi.hoisted(() => ({ createLinkEventMock: vi.fn() }));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

vi.mock('@nitrots/nitro-renderer', () => ({
    AvatarAction: { POSTURE_STAND: 'std' },
    AvatarExpressionEnum: {
        BLOW: { ordinal: 2 },
        IDLE: { ordinal: 3 },
        LAUGH: { ordinal: 4 },
        WAVE: { ordinal: 1 }
    },
    CreateLinkEvent: createLinkEventMock,
    RoomControllerLevel: { GUEST: 0 },
    RoomObjectCategory: { UNIT: 100 },
    RoomUnitDropHandItemComposer: class {}
}));

vi.mock('../../../../../api', () => ({
    DispatchUiEvent: vi.fn(),
    GetCanStandUp: () => false,
    GetCanUseExpression: () => true,
    GetOwnPosture: () => 'std',
    GetUserProfile: vi.fn(),
    HasHabboClub: () => true,
    HasHabboVip: () => true,
    IsRidingHorse: () => false,
    LocalizeText: (key: string) => key,
    PostureTypeEnum: { POSTURE_SIT: 'sit', POSTURE_STAND: 'stand' },
    SendMessageComposer: vi.fn()
}));

vi.mock('../../../../../events', () => ({ HelpNameChangeEvent: class {} }));

vi.mock('../../../../../hooks', () => ({
    useRoom: () => ({
        roomSession: {
            sendDanceMessage: vi.fn(),
            sendExpressionMessage: vi.fn(),
            sendPostureMessage: vi.fn(),
            sendSignMessage: vi.fn()
        }
    }),
    useWiredTools: () => ({ openInspectionForUser: vi.fn(), showInspectButton: false })
}));

vi.mock('../../context-menu/ContextMenuView', () => ({
    ContextMenuView: ({ children, classNames = [] }: { children: ReactNode; classNames?: string[] }) => <div className={classNames.join(' ')}>{children}</div>
}));

describe('AvatarInfoWidgetOwnAvatarView classic menu', () => {
    it('keeps the classic actions without the custom nickname and badge leaderboard entries', () => {
        render(
            <AvatarInfoWidgetOwnAvatarView
                avatarInfo={
                    {
                        allowNameChange: false,
                        amIAnyRoomController: false,
                        amIOwner: true,
                        carryItem: 0,
                        name: 'tester',
                        roomControllerLevel: 0,
                        roomIndex: 7,
                        userType: 1,
                        webID: 42
                    } as any
                }
                isDancing={false}
                setIsDecorating={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('widget.avatar.decorate')).toBeInTheDocument();
        expect(screen.getByText('widget.memenu.myclothes')).toBeInTheDocument();
        expect(screen.getByText('product.type.effect')).toBeInTheDocument();
        expect(screen.getByText('widget.memenu.dance')).toBeInTheDocument();
        expect(screen.getByText('infostand.link.expressions')).toBeInTheDocument();
        expect(screen.getByText('infostand.show.signs')).toBeInTheDocument();
        expect(screen.queryByText('Nick Custom')).not.toBeInTheDocument();
        expect(screen.queryByText('badge_leaderboard.title.total_badges')).not.toBeInTheDocument();
    });

    it('keeps retained actions wired and removes forbidden actions from the handler', () => {
        const setIsDecorating = vi.fn();

        render(
            <AvatarInfoWidgetOwnAvatarView
                avatarInfo={
                    {
                        allowNameChange: false,
                        amIAnyRoomController: false,
                        amIOwner: true,
                        carryItem: 0,
                        name: 'tester',
                        roomControllerLevel: 0,
                        roomIndex: 7,
                        userType: 1,
                        webID: 42
                    } as any
                }
                isDancing={false}
                setIsDecorating={setIsDecorating}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('widget.avatar.decorate'));
        fireEvent.click(screen.getByText('widget.memenu.myclothes'));
        fireEvent.click(screen.getByText('product.type.effect'));

        expect(setIsDecorating).toHaveBeenCalledWith(true);
        expect(createLinkEventMock).toHaveBeenCalledWith('avatar-editor/show');
        expect(createLinkEventMock).toHaveBeenCalledWith('avatar-effects/show');

        const source = readFileSync(resolve(process.cwd(), 'src/components/room/widgets/avatar-info/menu/AvatarInfoWidgetOwnAvatarView.tsx'), 'utf8');
        expect(source).not.toContain('customize_nick');
        expect(source).not.toContain('badge_leaderboard');
    });
});
