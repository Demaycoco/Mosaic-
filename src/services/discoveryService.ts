import { postService } from './postService';
import { projectService } from './projectService';
import { userService } from './userService';
import { nftService } from './nftService';
import { relayService } from './relayService';
import { SocialPost, NftProjectAccount, Creator, NftItem, RelayExperience } from '../types';

export interface SearchResults {
  query: string;
  users: Creator[];
  projects: NftProjectAccount[];
  posts: SocialPost[];
  collections: Array<{ name: string; count: number; sampleImage: string }>;
  hashtags: Array<{ tag: string; count: number }>;
  relays: RelayExperience[];
  totalResults: number;
}

export const discoveryService = {
  searchAll(query: string): SearchResults {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        query,
        users: [],
        projects: [],
        posts: [],
        collections: [],
        hashtags: [],
        relays: [],
        totalResults: 0,
      };
    }

    const cleanTag = q.replace(/^#/, '');

    // 1. Search Users
    const users = userService.searchUsers(q);

    // 2. Search Projects
    const projects = projectService.searchProjects(q);

    // 3. Search Posts
    const posts = postService.searchPosts(q);

    // 4. Search NFT collections
    const collections = nftService.getCollections().filter((c) =>
      c.name.toLowerCase().includes(q)
    );

    // 5. Search Hashtags (matching real hashtags from actual posts)
    const allHashtags = postService.getTrendingHashtags();
    const hashtags = allHashtags.filter((h) =>
      h.tag.toLowerCase().includes(cleanTag)
    );

    // 6. Search Relays
    const relays = relayService.searchRelays(q);

    const totalResults =
      users.length +
      projects.length +
      posts.length +
      collections.length +
      hashtags.length +
      relays.length;

    return {
      query,
      users,
      projects,
      posts,
      collections,
      hashtags,
      relays,
      totalResults,
    };
  },
};
