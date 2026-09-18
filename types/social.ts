export interface FriendItem {
  profileId: string;
  displayName: string;
  vibeId: string;
  college?: string | null;
  instagramHandle?: string;
  connectedAt: string;
}

export interface AttendeeSearchResult {
  id: string;
  displayName: string;
  vibeId: string;
  college?: string | null;
  instagramHandle: string;
  isFriend: boolean;
}
