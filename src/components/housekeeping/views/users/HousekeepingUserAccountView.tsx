import { FC, useState } from 'react';
import { FaKey, FaUserShield } from 'react-icons/fa';
import { HK_MAX_RANK, IHousekeepingUser, LocalizeText } from '../../../../api';
import { useHousekeeping, useHousekeepingDangerConfirm } from '../../../../hooks';
import { HousekeepingButton, HousekeepingNumberField, HousekeepingSection } from '../common/HousekeepingParts';

/** Rank and password of the selected user. */
export const HousekeepingUserAccountView: FC<{ user: IHousekeepingUser }> = ({ user }) => {
    const { isActionPending, setUserRank, resetUserPassword } = useHousekeeping();
    const confirmDanger = useHousekeepingDangerConfirm();
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
                    <HousekeepingButton
                        classNames={['ml-auto']}
                        disabled={isActionPending || rankDraft === user.rank}
                        gap={1}
                        variant="primary"
                        onClick={() =>
                            confirmDanger(
                                LocalizeText('housekeeping.user.account.rank_confirm', ['rank'], [String(rankDraft)]),
                                user.username,
                                () => setUserRank(user.id, rankDraft),
                                LocalizeText('housekeeping.action.set_rank')
                            )
                        }
                    >
                        <FaUserShield size={10} />
                        <span>{LocalizeText('housekeeping.action.set_rank')}</span>
                    </HousekeepingButton>
                </div>
            </HousekeepingSection>
            <HousekeepingSection icon={<FaKey className="text-zinc-500" size={9} />} title={LocalizeText('housekeeping.user.account.password')}>
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-600">{LocalizeText('housekeeping.user.account.password_hint')}</span>
                    <HousekeepingButton
                        classNames={['ml-auto', 'shrink-0']}
                        disabled={isActionPending}
                        gap={1}
                        variant="secondary"
                        onClick={() =>
                            confirmDanger(
                                LocalizeText('housekeeping.action.reset_password.confirm'),
                                user.username,
                                () => resetUserPassword(user.id),
                                LocalizeText('housekeeping.action.reset_password')
                            )
                        }
                    >
                        <FaKey size={10} />
                        <span>{LocalizeText('housekeeping.action.reset_password')}</span>
                    </HousekeepingButton>
                </div>
            </HousekeepingSection>
        </div>
    );
};
