export type AccountType = 'user' | 'project';

export interface MosaicUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  bannerURL?: string;
  username: string;
  bio: string;
  website?: string;
  xLink?: string;
  instagramLink?: string;
  tiktokLink?: string;
  nftCommunities?: string[]; // IDs of NFT community projects on Mosaic that the user belongs to
  interests?: string[];
  followingCount?: number;
  followersCount?: number;
  createdAt: string;
  updatedAt: string;
  accountType: AccountType;
  profileCompleted: boolean;
  linkedWalletAddress?: string;
  walletVerified?: boolean;
}

export * from './wallet';

export interface NftProjectAccount {
  id: string;
  name: string;
  username: string; // handle without @
  logo: string;
  banner: string;
  description: string;
  website?: string;
  xLink?: string;
  communityLink?: string;
  category: string;
  ownerId: string; // UID of user managing this project
  followersCount: number;
  collection?: {
    name: string;
    contractAddress?: string;
    itemsCount?: number;
    verificationStatus: 'unverified' | 'pending' | 'verified';
    featuredNftImage?: string;
  };
  relaysCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PostPoll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  voters: Record<string, string>; // userId -> optionId
  expiresAt: string;
}

export interface AttachedNftSummary {
  id: string;
  name: string;
  collection: string;
  image: string;
  relaysCount?: number;
}

export interface QuotedPostPreview {
  id: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL: string;
  text: string;
  mediaUrls?: string[];
  createdAt: string;
  isProject?: boolean;
}

export interface AttachedRelaySummary {
  id: string;
  title: string;
  collection: string;
  tokenId: string;
  nftImage: string;
  participantsCount: number;
  personalityTrait: string;
  question: string;
  creatorHandle?: string;
}

export type NFTReference = {
  network: string;
  contractAddress?: string;
  tokenId: string;
  name: string;
  collectionName?: string;
  imageUrl?: string;
  externalUrl?: string;
  metadataVerified: boolean;
  ownerVerified?: boolean;
};

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL: string;
  authorBadge?: string;
  authorAccountType?: AccountType;
  isProjectPost?: boolean;
  projectCategory?: string;
  text: string;
  mediaUrls?: string[];
  poll?: PostPoll;
  likesCount: number;
  likedBy: string[]; // user IDs
  repostsCount: number;
  repostedBy: string[]; // user IDs
  bookmarksCount: number;
  bookmarkedBy: string[]; // user IDs
  repliesCount: number;
  replyToId?: string;
  replyToUsername?: string;
  quotePostId?: string;
  quotePost?: QuotedPostPreview;
  threadId?: string;
  threadOrder?: number;
  totalInThread?: number;
  attachedNft?: AttachedNftSummary;
  nftReference?: NFTReference;
  attachedRelay?: AttachedRelaySummary;
  communityId?: string;
  communityHandle?: string;
  communityName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SocialCommunity {
  id: string;
  name: string;
  handle: string; // url slug without @
  description: string;
  avatarUrl: string;
  coverUrl?: string;
  creatorId: string;
  creatorName?: string;
  adminIds: string[];
  memberIds: string[];
  membersCount: number;
  postsCount: number;
  isVerified: boolean;
  category: string;
  postingPermission: 'all' | 'members' | 'admins';
  rules?: string[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ModerationReport {
  id: string;
  targetType: 'post' | 'profile';
  targetId: string; // postId or username
  targetAuthorId?: string;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'copyright' | 'misinformation' | 'other';
  notes?: string;
  reporterId: string;
  reporterUsername: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface UserBlockRecord {
  blockerId: string;
  blockedUsername: string;
  blockedUserId?: string;
  createdAt: string;
}

export interface SocialNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorPhotoURL: string;
  type: 'like' | 'repost' | 'reply' | 'follow' | 'quote' | 'mention' | 'community' | 'relay_invite' | 'relay_activity';
  postId?: string;
  relatedPostId?: string;
  relatedCommunityId?: string;
  relatedCommunityHandle?: string;
  relatedCommunityName?: string;
  text?: string;
  relayId?: string;
  relayTitle?: string;
  createdAt: string;
  readAt?: string;
  read: boolean;
}

export interface RelayExperience {
  id: string;
  title: string;
  tokenId: string;
  nftImage: string;
  collection: string;
  contractAddress?: string;
  chain?: string;
  creatorId?: string;
  creatorName?: string;
  creatorHandle?: string;
  creatorAvatar?: string;
  question: string;
  options: string[]; // e.g. ['CREATE', 'CHANGE']
  currentStage: number;
  totalStages?: number;
  activeCuratorName: string;
  activeCuratorHandle: string;
  participantsCount: number;
  description: string;
  status: 'active' | 'completed' | 'voting';
  steps: RelayStep[];
  createdAt?: string;
  updatedAt: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  badge?: string;
  followersCount: number;
  nftsCount: number;
  featuredNftImage?: string;
  verified?: boolean;
}

export interface NftItem {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  creator: {
    name: string;
    handle: string;
    avatar: string;
  };
  image: string;
  tags: string[];
  likes: number;
  relaysCount: number;
  commentsCount: number;
  price?: string;
  storySnippet?: string;
}

export interface RelayStep {
  step: number;
  personName: string;
  personHandle: string;
  avatar: string;
  userId?: string;
  action: string; // e.g. 'CREATE' | 'CHANGE' | 'Created' | 'Changed'
  decisionText: string;
  prediction?: string; // Optional: "What do you think the next person will choose?"
  timestamp: string;
  promptQuestion?: string;
}

export interface CommunityProject {
  id: string;
  title: string;
  tagline: string;
  banner: string;
  avatar: string;
  membersCount: number;
  activeRelays: number;
  category: string;
  verified: boolean;
}

export interface SocialFeedItem {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    badge?: string;
  };
  timestamp: string;
  content: string;
  attachedNft?: {
    id: string;
    name: string;
    image: string;
    collection: string;
  };
  likes: number;
  replies: number;
  shares: number;
  isLiked?: boolean;
}

export type PersonalityTraitName =
  | 'Contrarian'
  | 'Consensus Seeker'
  | 'Creator'
  | 'Explorer'
  | 'Risk Taker'
  | 'Observer';

export interface NftPersonality {
  title: PersonalityTraitName;
  tagline: string;
  summary: string;
  disagreementPct: number;
  consensusPct: number;
  disagreementCount: number;
  consensusCount: number;
  accentColor: string;
}

export interface RelayMetrics {
  participantsCount: number;
  decisionsCount: number;
  predictionsCount: number;
  contradictionsCount: number;
  disagreementPct: number;
  consensusPct: number;
  longestPredictionStreak: number;
  journeyLength: number;
}

export interface RelayMilestone {
  id:
    | 'first_relay'
    | 'ten_humans'
    | 'first_contradiction'
    | 'prediction_streak'
    | 'twenty_five_decisions'
    | 'hundred_participants';
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAtChapter?: number;
  currentProgress: number;
  targetProgress: number;
}
