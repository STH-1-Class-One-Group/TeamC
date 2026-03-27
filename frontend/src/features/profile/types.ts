export interface Profile {
  id: string;
  nickname: string;
  rank: string | null;
  unit: string | null;
  enlistment_date: string | null;
  profile_completed: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormValues {
  nickname: string;
  rank: string;
  unit: string;
  enlistmentDate: string;
}
