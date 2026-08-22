import {
    AddLinkEventTracker,
    AvatarEditorFigureCategory,
    AvatarFigurePartType,
    GetSessionDataManager,
    ILinkEventTracker,
    RemoveLinkEventTracker,
    SetClothingChangeDataMessageComposer,
    UserFigureComposer
} from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaDice, FaRedo, FaTrash } from 'react-icons/fa';
import { AvatarEditorAction, LocalizeText, SendMessageComposer } from '../../api';
import mainGenericSrc from '../../assets/images/avatareditor/air/main-generic.png';
import mainHeadSrc from '../../assets/images/avatareditor/air/main-head.png';
import mainLegsSrc from '../../assets/images/avatareditor/air/main-legs.png';
import mainTorsoSrc from '../../assets/images/avatareditor/air/main-torso.png';
import mainMiscSrc from '../../assets/images/wardrobe/misc.png';
import mainNftSrc from '../../assets/images/wardrobe/nft.png';
import mainPetsSrc from '../../assets/images/wardrobe/pets.png';
import { Button, ButtonGroup, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useAvatarEditor } from '../../hooks';
import { AvatarEditorFigurePreviewView } from './AvatarEditorFigurePreviewView';
import { AvatarEditorModelView } from './AvatarEditorModelView';
import { AvatarEditorNftView } from './AvatarEditorNftView';
import { AvatarEditorPetView } from './AvatarEditorPetView';
import { AvatarEditorWardrobeView } from './AvatarEditorWardrobeView';

const MAIN_TAB_ICONS: Record<string, string> = {
    [AvatarEditorFigureCategory.GENERIC]: mainGenericSrc,
    [AvatarEditorFigureCategory.HEAD]: mainHeadSrc,
    [AvatarEditorFigureCategory.TORSO]: mainTorsoSrc,
    [AvatarEditorFigureCategory.LEGS]: mainLegsSrc,
    [AvatarEditorFigureCategory.PETS]: mainPetsSrc,
    [AvatarEditorFigureCategory.MISC]: mainMiscSrc,
    [AvatarEditorFigureCategory.NFT]: mainNftSrc
};

export const AvatarEditorView: FC<{}> = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
    const {
        setIsVisible: setEditorVisibility,
        clothingChangeData = null,
        setClothingChangeData = null,
        avatarModels,
        activeModelKey,
        setActiveModelKey,
        loadAvatarData,
        getFigureStringWithFace,
        gender,
        randomizeCurrentFigure = null,
        getFigureString = null
    } = useAvatarEditor();

    const isPetsOpen = activeModelKey === AvatarEditorFigureCategory.PETS;
    const isNftOpen = activeModelKey === AvatarEditorFigureCategory.NFT;
    const canUseWardrobe = !clothingChangeData && !isNftOpen;

    const processAction = (action: string) => {
        switch (action) {
            case AvatarEditorAction.ACTION_RESET:
                loadAvatarData(GetSessionDataManager().figure, GetSessionDataManager().gender);
                return;
            case AvatarEditorAction.ACTION_CLEAR:
                loadAvatarData(getFigureStringWithFace(0, false), gender);
                return;
            case AvatarEditorAction.ACTION_RANDOMIZE:
                randomizeCurrentFigure();
                return;
            case AvatarEditorAction.ACTION_SAVE:
                if (clothingChangeData) {
                    SendMessageComposer(new SetClothingChangeDataMessageComposer(clothingChangeData.objectId, gender, getFigureString));
                } else {
                    SendMessageComposer(new UserFigureComposer(gender, getFigureString));
                }
                setIsVisible(false);
                return;
        }
    };

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        if (parts[2] && parts[3] && (parts[2] === AvatarFigurePartType.MALE || parts[2] === AvatarFigurePartType.FEMALE)) {
                            setClothingChangeData({ objectId: Number(parts[3]), gender: parts[2] });
                            setIsWardrobeOpen(false);
                        } else {
                            setClothingChangeData(null);
                            setIsWardrobeOpen(true);
                        }
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setClothingChangeData(null);
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setClothingChangeData(null);
                        setIsVisible((prevValue) => {
                            if (!prevValue) setIsWardrobeOpen(true);

                            return !prevValue;
                        });
                        return;
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [setClothingChangeData]);

    useEffect(() => {
        setEditorVisibility(isVisible);

        if (!isVisible) {
            setClothingChangeData(null);
            setIsWardrobeOpen(false);
        }
    }, [isVisible, setEditorVisibility, setClothingChangeData]);

    useEffect(() => {
        if (!canUseWardrobe) setIsWardrobeOpen(false);
    }, [canUseWardrobe]);

    if (!isVisible) return null;

    return (
        <NitroCardView className={`nitro-avatar-editor${isWardrobeOpen ? ' is-wardrobe-open' : ''}`} isResizable={false} uniqueKey="avatar-editor">
            <NitroCardHeaderView
                headerText={LocalizeText(clothingChangeData ? 'widget.furni.clothingchange.editor.title' : 'avatareditor.title')}
                onCloseClick={(event) => setIsVisible(false)}
            />
            <NitroCardContentView className="nitro-avatar-editor-content">
                <div className="nitro-avatar-editor-stage">
                    <div className="nitro-avatar-editor-nameplate">
                        <span>{GetSessionDataManager().userName}</span>
                    </div>
                    <div className="nitro-avatar-editor-tab-row">
                        <NitroCardTabsView classNames={['avatar-editor-tabs']}>
                            {Object.keys(avatarModels)
                                .filter((modelKey) => modelKey !== AvatarEditorFigureCategory.WARDROBE)
                                .map((modelKey) => (
                                    <NitroCardTabsItemView
                                        key={modelKey}
                                        classNames={['nitro-avatar-editor-main-tab']}
                                        isActive={activeModelKey === modelKey}
                                        onClick={() => setActiveModelKey(modelKey)}
                                    >
                                        <img className="nitro-avatar-editor-main-tab-icon" src={MAIN_TAB_ICONS[modelKey]} alt="" draggable={false} />
                                    </NitroCardTabsItemView>
                                ))}
                        </NitroCardTabsView>
                    </div>
                    {canUseWardrobe && (
                        <button
                            type="button"
                            className={`nitro-avatar-editor-wardrobe-toggle${isWardrobeOpen ? ' is-open' : ''}`}
                            aria-pressed={isWardrobeOpen}
                            aria-label={LocalizeText('avatareditor.wardrobe.title')}
                            onClick={() => setIsWardrobeOpen((open) => !open)}
                        />
                    )}
                    <div className="nitro-avatar-editor-main">
                        {activeModelKey.length > 0 && !isPetsOpen && !isNftOpen && (
                            <AvatarEditorModelView categories={avatarModels[activeModelKey]} name={activeModelKey} />
                        )}
                        {isPetsOpen && <AvatarEditorPetView categories={avatarModels[activeModelKey]} />}
                        {isNftOpen && <AvatarEditorNftView categories={avatarModels[activeModelKey]} />}
                        <AvatarEditorFigurePreviewView />
                        {!clothingChangeData && (
                            <ButtonGroup className="nitro-avatar-editor-secondary-actions">
                                <Button variant="secondary" onClick={() => processAction(AvatarEditorAction.ACTION_RESET)}>
                                    <FaRedo className="fa-icon" />
                                </Button>
                                <Button variant="secondary" onClick={() => processAction(AvatarEditorAction.ACTION_CLEAR)}>
                                    <FaTrash className="fa-icon" />
                                </Button>
                                <Button variant="secondary" onClick={() => processAction(AvatarEditorAction.ACTION_RANDOMIZE)}>
                                    <FaDice className="fa-icon" />
                                </Button>
                            </ButtonGroup>
                        )}
                        <Button className="nitro-avatar-editor-save" variant="success" onClick={() => processAction(AvatarEditorAction.ACTION_SAVE)}>
                            {LocalizeText('avatareditor.save')}
                        </Button>
                    </div>
                </div>
                {isWardrobeOpen && canUseWardrobe && <AvatarEditorWardrobeView />}
            </NitroCardContentView>
        </NitroCardView>
    );
};
