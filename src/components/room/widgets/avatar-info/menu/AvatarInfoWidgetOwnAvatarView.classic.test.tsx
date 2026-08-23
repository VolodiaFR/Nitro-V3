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
    it('keeps the classic actions alongside the custom nickname and badge leaderboard entries', () => {
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
        expect(screen.getByText('Nick Custom')).toBeInTheDocument();
        expect(screen.getByText('badge_leaderboard.title.total_badges')).toBeInTheDocument();
    });

    it('keeps retained actions wired and opens the customize and leaderboard windows', () => {
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
        fireEvent.click(screen.getByText('Nick Custom'));
        fireEvent.click(screen.getByText('badge_leaderboard.title.total_badges'));

        expect(setIsDecorating).toHaveBeenCalledWith(true);
        expect(createLinkEventMock).toHaveBeenCalledWith('avatar-editor/show');
        expect(createLinkEventMock).toHaveBeenCalledWith('avatar-effects/show');
        expect(createLinkEventMock).toHaveBeenCalledWith('customize/show');
        expect(createLinkEventMock).toHaveBeenCalledWith('badge-leaderboard/show');
    });
});
