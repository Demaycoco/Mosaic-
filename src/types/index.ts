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
  createdAt: string;
  updatedAt?: string;
}

export interface SocialNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorPhotoURL: string;
  type: 'like' | 'repost' | 'reply' | 'follow' | 'quote' | 'mention' | 'relay_invite' | 'relay_activity';
  postId?: string;
  text?: string;
  relayId?: string;
  relayTitle?: string;
  createdAt: string;
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
