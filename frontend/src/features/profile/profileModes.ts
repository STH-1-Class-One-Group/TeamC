import { getCadreRankOptions } from '../../utils/serviceDates';
import { Profile, ProfileFormValues } from './types';

type ValidationErrors = Partial<
  Record<
    | 'nickname'
    | 'userType'
    | 'cadreCategory'
    | 'rank'
    | 'serviceTrack'
    | 'enlistmentDate'
    | 'acquaintanceName'
    | 'acquaintanceServiceTrack'
    | 'acquaintanceEnlistmentDate',
    string
  >
>;

abstract class ProfileMode {
  abstract readonly type: string;

  normalize(values: ProfileFormValues): ProfileFormValues {
    return values;
  }

  validate(values: ProfileFormValues, todayInputValue: string): ValidationErrors {
    if (!values.nickname.trim()) {
      return { nickname: '닉네임을 입력해주세요.' };
    }

    if (!values.userType) {
      return { userType: '회원 유형을 선택해주세요.' };
    }

    if (values.enlistmentDate && values.enlistmentDate > todayInputValue) {
      return { enlistmentDate: '입대일은 오늘 이후로 설정할 수 없습니다.' };
    }

    if (
      values.acquaintanceEnlistmentDate &&
      values.acquaintanceEnlistmentDate > todayInputValue
    ) {
      return {
        acquaintanceEnlistmentDate: '지인 입대일은 오늘 이후로 설정할 수 없습니다.',
      };
    }

    return {};
  }

  isProfileComplete(profile: Profile | null): boolean {
    return Boolean(profile?.profile_completed && profile?.user_type === this.type);
  }
}

class CivilianMode extends ProfileMode {
  readonly type = 'civilian';

  override normalize(values: ProfileFormValues): ProfileFormValues {
    return {
      ...values,
      cadreCategory: '',
      rank: '',
      unit: '',
      enlistmentDate: '',
      serviceTrack: '',
    };
  }

  override validate(values: ProfileFormValues, todayInputValue: string): ValidationErrors {
    const baseErrors = super.validate(values, todayInputValue);
    if (Object.keys(baseErrors).length > 0) {
      return baseErrors;
    }

    const hasAnyAcquaintance =
      Boolean(values.acquaintanceName.trim()) ||
      Boolean(values.acquaintanceServiceTrack) ||
      Boolean(values.acquaintanceEnlistmentDate);

    if (!hasAnyAcquaintance) {
      return {};
    }

    if (!values.acquaintanceName.trim()) {
      return { acquaintanceName: '지인 이름을 입력해주세요.' };
    }

    if (!values.acquaintanceServiceTrack) {
      return { acquaintanceServiceTrack: '지인의 복무 유형을 선택해주세요.' };
    }

    if (!values.acquaintanceEnlistmentDate) {
      return { acquaintanceEnlistmentDate: '지인의 입대일을 입력해주세요.' };
    }

    return {};
  }
}

class ActiveEnlistedMode extends ProfileMode {
  readonly type = 'active_enlisted';

  override normalize(values: ProfileFormValues): ProfileFormValues {
    return {
      ...values,
      cadreCategory: '',
      rank: '',
      acquaintanceName: '',
      acquaintanceServiceTrack: '',
      acquaintanceEnlistmentDate: '',
    };
  }

  override validate(values: ProfileFormValues, todayInputValue: string): ValidationErrors {
    const baseErrors = super.validate(values, todayInputValue);
    if (Object.keys(baseErrors).length > 0) {
      return baseErrors;
    }

    if (!values.serviceTrack) {
      return { serviceTrack: '복무 유형을 선택해주세요.' };
    }

    if (!values.enlistmentDate) {
      return { enlistmentDate: '입대일을 입력해주세요.' };
    }

    return {};
  }

  override isProfileComplete(profile: Profile | null): boolean {
    return Boolean(super.isProfileComplete(profile) && profile?.service_track && profile?.enlistment_date);
  }
}

class ActiveCadreMode extends ProfileMode {
  readonly type = 'active_cadre';

  override normalize(values: ProfileFormValues): ProfileFormValues {
    return {
      ...values,
      serviceTrack: '',
      acquaintanceName: '',
      acquaintanceServiceTrack: '',
      acquaintanceEnlistmentDate: '',
    };
  }

  override validate(values: ProfileFormValues, todayInputValue: string): ValidationErrors {
    const baseErrors = super.validate(values, todayInputValue);
    if (Object.keys(baseErrors).length > 0) {
      return baseErrors;
    }

    if (!values.cadreCategory) {
      return { cadreCategory: '간부 유형을 선택해주세요.' };
    }

    if (!values.rank.trim()) {
      return { rank: '계급 또는 직급을 선택해주세요.' };
    }

    const rankOptions: string[] = getCadreRankOptions(values.cadreCategory);
    if (!rankOptions.includes(values.rank.trim())) {
      return { rank: '선택한 간부 유형에 맞는 계급/직급을 선택해주세요.' };
    }

    if (!values.enlistmentDate) {
      return { enlistmentDate: '임용일 또는 입대일을 입력해주세요.' };
    }

    return {};
  }

  override isProfileComplete(profile: Profile | null): boolean {
    return Boolean(
      super.isProfileComplete(profile) &&
        profile?.cadre_category &&
        profile?.rank &&
        profile?.enlistment_date
    );
  }
}

const CIVILIAN_MODE = new CivilianMode();
const ACTIVE_ENLISTED_MODE = new ActiveEnlistedMode();
const ACTIVE_CADRE_MODE = new ActiveCadreMode();

export const PROFILE_MODE_REGISTRY: Record<string, ProfileMode> = {
  [CIVILIAN_MODE.type]: CIVILIAN_MODE,
  [ACTIVE_ENLISTED_MODE.type]: ACTIVE_ENLISTED_MODE,
  [ACTIVE_CADRE_MODE.type]: ACTIVE_CADRE_MODE,
};

export const getProfileMode = (userType: string | null | undefined) =>
  (userType ? PROFILE_MODE_REGISTRY[userType] : undefined) ?? null;

export const isProfileSetupRequired = (profile: Profile | null) => {
  if (!profile) {
    return true;
  }

  const mode = getProfileMode(profile.user_type);
  if (!mode) {
    return true;
  }

  return !mode.isProfileComplete(profile);
};
