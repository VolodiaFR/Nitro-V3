import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvatarInfoWidgetOwnAvatarView } from './AvatarInfoWidgetOwnAvatarView';

const mocks = vi.hoisted(() => ({
    config: new Map<string, unknown>(),
    createLinkEvent: vi.fn(),
    effectId: 0,
    hasClub: true,
    hasVip: true,
    posture: 'std',
    sendDanceMessage: vi.fn(),
    sendExpressionMessage: vi.fn(),
    sendPostureMessage: vi.fn(),
    sendSignMessage: vi.fn(),
    showInspectButton: true
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.config.clear();
    mocks.effectId = 0;
    mocks.hasClub = true;
    mocks.hasVip = true;
    mocks.posture = 'std';
    mocks.showInspectButton = true;
});

vi.mock('@nitrots/nitro-renderer', () => ({
    AvatarAction: { POSTURE_STAND: 'std', POSTURE_SWIM: 'swim' },
    AvatarExpressionEnum: {
        BLOW: { ordinal: 2 },
        IDLE: { ordinal: 3 },
        LAUGH: { ordinal: 4 },
        WAVE: { ordinal: 1 }
    },
    CreateLinkEvent: mocks.createLinkEvent,
    RoomControllerLevel: { GUEST: 0 },
    RoomObjectCategory: { UNIT: 100 },
    RoomObjectVariable: { FIGURE_EFFECT: 'figure_effect' },
    RoomUnitDropHandItemComposer: class {}
}));

vi.mock('../../../../../api', () => ({
    DispatchUiEvent: vi.fn(),
    GetCanStandUp: () => false,
    GetConfigurationValue: (key: string, fallback: unknown) => (mocks.config.has(key) ? mocks.config.get(key) : fallback),
    GetOwnPosture: () => mocks.posture,
    GetOwnRoomObject: () => ({ model: { getValue: () => mocks.effectId } }),
    GetUserProfile: vi.fn(),
    HasHabboClub: () => mocks.hasClub,
    HasHabboVip: () => mocks.hasVip,
    IsRidingHorse: () => false,
    LocalizeText: (key: string) => key,
    PostureTypeEnum: { POSTURE_SIT: 'sit', POSTURE_STAND: 'stand' },
    SendMessageComposer: vi.fn()
}));

vi.mock('../../../../../events', () => ({ HelpNameChangeEvent: class {} }));

vi.mock('../../../../../hooks', () => ({
    useRoom: () => ({
        roomSession: {
            sendDanceMessage: mocks.sendDanceMessage,
            sendExpressionMessage: mocks.sendExpressionMessage,
            sendPostureMessage: mocks.sendPostureMessage,
            sendSignMessage: mocks.sendSignMessage
        }
    }),
    useWiredTools: () => ({ openInspectionForUser: vi.fn(), showInspectButton: mocks.showInspectButton })
}));

vi.mock('../../context-menu/ContextMenuView', () => ({
    ContextMenuView: ({
        children,
        classNames = [],
        freezePositionOnHover,
        maximumVerticalLeadRatio,
        tallAvatarOffset
    }: {
        children: ReactNode;
        classNames?: string[];
        freezePositionOnHover?: boolean;
        maximumVerticalLeadRatio?: number;
        tallAvatarOffset?: number;
    }) => (
        <div
            className={classNames.join(' ')}
            data-freeze-position-on-hover={String(freezePositionOnHover)}
            data-maximum-vertical-lead-ratio={maximumVerticalLeadRatio}
            data-tall-avatar-offset={tallAvatarOffset}
        >
            {children}
        </div>
    )
}));

const avatarInfo = {
    allowNameChange: true,
    amIAnyRoomController: false,
    amIOwner: true,
    carryItem: 7,
    name: 'tester',
    roomControllerLevel: 0,
    roomIndex: 7,
    userType: 1,
    webID: 42
} as any;

const renderMenu = (onClose = vi.fn(), isDancing = false) =>
    render(<AvatarInfoWidgetOwnAvatarView avatarInfo={avatarInfo} isDancing={isDancing} setIsDecorating={vi.fn()} onClose={onClose} />);

const getActionLabels = () => Array.from(document.querySelector('.air-avatar-menu-buttons').children).map((element) => element.textContent);

describe('AIR own-avatar menu', () => {
    it('uses the own-menu variant, AIR anchor rules, XML row order, and then Polaris extras', () => {
        renderMenu();

        const menu = document.querySelector('.nitro-avatar-action-menu--own');

        expect(menu).toHaveClass('nitro-avatar-action-menu');
        expect(menu).toHaveAttribute('data-tall-avatar-offset', '25');
        expect(menu).toHaveAttribute('data-maximum-vertical-lead-ratio', '0.05');
        expect(menu).toHaveAttribute('data-freeze-position-on-hover', 'true');
        expect(getActionLabels()).toEqual([
            'widget.avatar.change_name',
            'widget.avatar.decorate',
            'widget.memenu.myclothes',
            'infostand.link.expressions',
            'widget.memenu.dance',
            'infostand.show.signs',
            'avatar.widget.drop_hand_item',
            'widget.memenu.effects',
            'infostand.button.wired_inspect',
            'Nick Custom',
            'badge_leaderboard.title.total_badges'
        ]);
        expect(screen.queryByText('product.type.effect')).not.toBeInTheDocument();
    });

    it('keeps the retained AIR and Polaris actions wired', () => {
        const onClose = vi.fn();

        renderMenu(onClose);

        fireEvent.click(screen.getByText('widget.memenu.myclothes'));
        fireEvent.click(screen.getByText('widget.memenu.effects'));
        fireEvent.click(screen.getByText('Nick Custom'));
        fireEvent.click(screen.getByText('badge_leaderboard.title.total_badges'));

        expect(mocks.createLinkEvent).toHaveBeenCalledWith('avatar-editor/show');
        expect(mocks.createLinkEvent).toHaveBeenCalledWith('avatar-effects/show');
        expect(mocks.createLinkEvent).toHaveBeenCalledWith('customize/show');
        expect(mocks.createLinkEvent).toHaveBeenCalledWith('badge-leaderboard/show');
        expect(onClose).toHaveBeenCalledTimes(4);
    });

    it('applies the AIR club gate to room decoration', () => {
        mocks.hasClub = false;

        renderMenu();

        expect(screen.queryByText('widget.avatar.decorate')).not.toBeInTheDocument();
        expect(screen.getByText('widget.memenu.dance')).toBeInTheDocument();
    });

    it('opens directly on the AIR club-dance list while dancing without an effect', () => {
        renderMenu(vi.fn(), true);

        expect(getActionLabels()).toEqual([
            'widget.memenu.dance.stop',
            'widget.memenu.dance1',
            'widget.memenu.dance2',
            'widget.memenu.dance3',
            'widget.memenu.dance4',
            'generic.back'
        ]);
        expect(screen.getByText('widget.memenu.dance.stop').closest('.nitro-context-menu-item')).not.toHaveClass('disabled');
    });

    it('packs the expression submenu in XML order and opens Club Center for locked VIP rows', () => {
        mocks.hasVip = false;
        mocks.config.set('avatar.expression.67.enabled', true);
        const onClose = vi.fn();

        renderMenu(onClose);
        fireEvent.click(screen.getByText('infostand.link.expressions'));

        expect(getActionLabels()).toEqual([
            'widget.memenu.sit',
            'widget.memenu.wave',
            'widget.memenu.blow',
            'widget.memenu.expression_67',
            'widget.memenu.laugh',
            'widget.memenu.idle',
            'generic.back'
        ]);
        expect(document.querySelectorAll('.air-avatar-menu-vip')).toHaveLength(3);
        expect(document.querySelectorAll('.air-avatar-menu-item--locked')).toHaveLength(3);

        fireEvent.click(screen.getByText('widget.memenu.blow'));

        expect(mocks.createLinkEvent).toHaveBeenCalledWith('habboUI/open/hccenter');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders and dispatches the complete 3 by 6 AIR sign grid', () => {
        renderMenu();
        fireEvent.click(screen.getByText('infostand.show.signs'));

        const cells = document.querySelectorAll('.air-avatar-menu-sign-cell');

        expect(cells).toHaveLength(18);
        expect(document.querySelectorAll('.air-avatar-menu-sign-icon')).toHaveLength(7);
        cells.forEach((cell) => fireEvent.click(cell));
        expect(mocks.sendSignMessage.mock.calls.map(([sign]) => sign)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13, 15, 14, 17, 16]);
    });
});
