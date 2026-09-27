import { FC, useState } from 'react';
import { FaKey, FaUserShield } from 'react-icons/fa';
import { HK_MAX_RANK, IHousekeepingUser, LocalizeText } from '../../../../api';
import { Button } from '../../../../common';
import { useHousekeeping, useHousekeepingConfirm } from '../../../../hooks';
import { HousekeepingNumberField, HousekeepingSection } from '../common/HousekeepingParts';

/** Rank and password of the selected user. */
export const HousekeepingUserAccountView: FC<{ user: IHousekeepingUser }> = ({ user }) => {
    const { isActionPending, setUserRank, resetUserPassword } = useHousekeeping();
    const confirm = useHousekeepingConfirm();
    const [rankDraft, setRankDraft] = useState<number>(user.rank || 1);

    return (
        <div className="flex flex-col gap-2">
            <HousekeepingSection
                icon={<FaUserShield className="text-violet-500" size={9} />}
                title={LocalizeText('housekeeping.user.account.rank')}
                tone="accent"
            >
                <div className="flex items-center gap-1.5">
                    <HousekeepingNumberField label={LocalizeText('housekeeping.field.rank')} max={HK_MAX_RANK} value={rankDraft} onChange={setRankDraft} />
                    <span className="text-[10px] text-zinc-500">
                        {LocalizeText('housekeeping.user.account.rank_current', ['rank'], [`${user.rankName} (${user.rank})`])}
                    </span>
                    <Button
                        classNames={['ml-auto']}
                        disabled={isActionPending || rankDraft === user.rank}
                        gap={1}
                        variant="primary"
                        onClick={() =>
                            confirm(LocalizeText('housekeeping.user.account.rank_confirm', ['rank'], [String(rankDraft)]), () =>
                                setUserRank(user.id, rankDraft)
                            )
                        }
                    >
                        <FaUserShield size={10} />
                        <span>{LocalizeText('housekeeping.action.set_rank')}</span>
                    </Button>
                </div>
            </HousekeepingSection>
            <HousekeepingSection icon={<FaKey className="text-zinc-500" size={9} />} title={LocalizeText('housekeeping.user.account.password')}>
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-600">{LocalizeText('housekeeping.user.account.password_hint')}</span>
                    <Button
                        classNames={['ml-auto', 'shrink-0']}
                        disabled={isActionPending}
                        gap={1}
                        variant="secondary"
                        onClick={() => confirm(LocalizeText('housekeeping.action.reset_password.confirm'), () => resetUserPassword(user.id))}
                    >
                        <FaKey size={10} />
                        <span>{LocalizeText('housekeeping.action.reset_password')}</span>
                    </Button>
                </div>
            </HousekeepingSection>
        </div>
    );
};
