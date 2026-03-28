export interface Profile {
  id: string;
  nickname: string;
  user_type: string | null;
  cadre_category: string | null;
  rank: string | null;
  unit: string | null;
  enlistment_date: string | null;
  service_track: string | null;
  acquaintance_name: string | null;
  acquaintance_service_track: string | null;
  acquaintance_enlistment_date: string | null;
  profile_completed: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormValues {
  nickname: string;
  userType: string;
  cadreCategory: string;
  rank: string;
  unit: string;
  enlistmentDate: string;
  serviceTrack: string;
  acquaintanceName: string;
  acquaintanceServiceTrack: string;
  acquaintanceEnlistmentDate: string;
}
