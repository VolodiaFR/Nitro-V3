import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';
import { Base, Grid, Flex, NitroCardView, NitroCardHeaderView, NitroCardTabsView, NitroCardTabsItemView, NitroCardContentView, Text } from '../../common';
import { useRoom } from '../../hooks';
import { GetConfigurationValue } from '../../api';

interface ItemData {
    id: number;
}

interface BackgroundsViewProps {
    setIsVisible: Dispatch<SetStateAction<boolean>>;
    selectedBackground: number;
    setSelectedBackground: Dispatch<SetStateAction<number>>;
    selectedStand: number;
    setSelectedStand: Dispatch<SetStateAction<number>>;
    selectedOverlay: number;
    setSelectedOverlay: Dispatch<SetStateAction<number>>;
    selectedCardBackground: number;
    setSelectedCardBackground: Dispatch<SetStateAction<number>>;
}

const TABS = ['backgrounds', 'stands', 'overlays', 'cards'] as const;
type TabType = typeof TABS[number];

export const BackgroundsView: FC<BackgroundsViewProps> = ({
    setIsVisible,
    selectedBackground,
    setSelectedBackground,
    selectedStand,
    setSelectedStand,
    selectedOverlay,
    setSelectedOverlay,
    selectedCardBackground,
    setSelectedCardBackground
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('backgrounds');
    const { roomSession } = useRoom();

    const processData = useCallback((configData: any[], idField: string): ItemData[] => {
        if (!configData?.length) return [];

        return configData.map(item => ({ id: item[idField] }));
    }, []);

    const allData = useMemo(() => ({
        backgrounds: processData(GetConfigurationValue('backgrounds.data'), 'backgroundId'),
        stands: processData(GetConfigurationValue('stands.data'), 'standId'),
        overlays: processData(GetConfigurationValue('overlays.data'), 'overlayId'),
        cards: processData(GetConfigurationValue('cards.data') || GetConfigurationValue('backgrounds.data'), 'backgroundId')
    }), [processData]);

    const handleSelection = useCallback((id: number) => {
        if (!roomSession) return;

        const setters = { backgrounds: setSelectedBackground, stands: setSelectedStand, overlays: setSelectedOverlay, cards: setSelectedCardBackground };

        const currentValues = { backgrounds: selectedBackground, stands: selectedStand, overlays: selectedOverlay, cards: selectedCardBackground };

        setters[activeTab](id);
        const newValues = { ...currentValues, [activeTab]: id };
        roomSession.sendBackgroundMessage( newValues.backgrounds, newValues.stands, newValues.overlays, newValues.cards );
    }, [activeTab, roomSession, selectedBackground, selectedStand, selectedOverlay, selectedCardBackground, setSelectedBackground, setSelectedStand, setSelectedOverlay, setSelectedCardBackground]);

    const renderItem = useCallback((item: ItemData, type: string) => (
        <Flex
            pointer
            position="relative"
            key={item.id}
            onClick={() => handleSelection(item.id)}
        >
            <Base
                className={`profile-${type} ${type}-${item.id}`}
                style={type === 'card-background' ? { width: 60, height: 80, borderRadius: 4 } : undefined}
            />
        </Flex>
    ), [handleSelection]);

    return (
        <NitroCardView uniqueKey="backgrounds" className="absolute min-w-[535px] max-w-[535px] min-h-[389px] max-h-[389px]">
            <NitroCardHeaderView headerText="Profile Background" onCloseClick={() => setIsVisible(false)} />
            <NitroCardTabsView>
                {TABS.map(tab => (
                    <NitroCardTabsItemView
                        key={tab}
                        isActive={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </NitroCardTabsItemView>
                ))}
            </NitroCardTabsView>
            <NitroCardContentView gap={1}>
                <Text bold center>Select an Option</Text>
                <Grid gap={1} columnCount={7} overflow="auto">
                    {allData[activeTab].map(item => renderItem(item, activeTab === 'cards' ? 'card-background' : activeTab.slice(0, -1)))}
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
};