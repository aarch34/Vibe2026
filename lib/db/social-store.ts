import fs from "fs";
import path from "path";
import { Post, PostLike, PostComment, ConnectionRequest, Connection, Profile, Notification } from "@/types/database";
import { isUsingLiveSupabase, supabaseAdmin } from "./supabase";
import { mockDb } from "./mock-store";
import { getProfileByIdOrClerkId, normalizeSupabaseProfile } from "./profiles";

interface SocialStoreData {
  posts: Post[];
  postLikes: PostLike[];
  postComments: PostComment[];
  connectionRequests: ConnectionRequest[];
  connections: Connection[];
  awardedLikeXp?: string[];
}

const TMP_DIR = path.join(process.cwd(), ".tmp");
const STORAGE_FILE = path.join(TMP_DIR, "vibe-social.json");

const INITIAL_CURATED_POSTS: Post[] = [];

const INITIAL_CURATED_COMMENTS: PostComment[] = [];

function isUUID(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function createCuratedProfile(data: Partial<Profile> & { id: string; display_name: string; username: string }): Profile {
  return {
    id: data.id,
    clerk_user_id: data.clerk_user_id || `curated-${data.id}`,
    vibe_id: data.vibe_id || `VB-${data.id.slice(-4)}`,
    display_name: data.display_name,
    username: data.username,
    avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
    avatar_media_id: null,
    email: data.email || `${data.username}@vibe2026.rotaract.org`,
    phone: "",
    rotaract_club: data.rotaract_club || "Rotaract District 3192",
    college: data.college || "Rotaract District 3192",
    course_year: "Student",
    instagram_username: data.instagram_username || null,
    bio: data.bio || null,
    interests: data.interests || ["Rotaract", "Leadership"],
    is_discoverable: true,
    xp: data.xp || 1000,
    level_number: data.level_number || 4,
    level_name: data.level_name || "VIBE RIDER",
    connections_count: data.connections_count || 12,
    posts_count: data.posts_count || 3,
    games_played_count: data.games_played_count || 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const CURATED_PROFILES: Record<string, Profile> = {};

const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

class PersistentSocialStore {
  private data: SocialStoreData;

  constructor() {
    this.data = this.loadFromDisk();
    this.syncToMockDb();
  }

  private loadFromDisk(): SocialStoreData {
    if (isTestEnv) {
      return {
        posts: [...INITIAL_CURATED_POSTS],
        postLikes: [],
        postComments: [...INITIAL_CURATED_COMMENTS],
        connectionRequests: [],
        connections: [],
        awardedLikeXp: [],
      };
    }

    try {
      if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
      }

      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, "utf8").trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.posts)) {
            return {
              posts: parsed.posts || [],
              postLikes: parsed.postLikes || [],
              postComments: parsed.postComments || [],
              connectionRequests: parsed.connectionRequests || [],
              connections: parsed.connections || [],
              awardedLikeXp: parsed.awardedLikeXp || [],
            };
          }
        }
      }
    } catch (err) {
      console.warn("Could not read social store from disk, initializing fresh:", err);
    }

    return {
      posts: [...INITIAL_CURATED_POSTS],
      postLikes: [],
      postComments: [...INITIAL_CURATED_COMMENTS],
      connectionRequests: [],
      connections: [],
      awardedLikeXp: [],
    };
  }

  private saveToDisk() {
    if (isTestEnv) return;

    try {
      if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.data, null, 2), "utf8");
    } catch (err) {
      console.warn("Could not save social store to disk:", err);
    }
  }

  private syncToMockDb() {
    // Keep mockDb aligned with persistent data
    mockDb.posts = this.data.posts;
    mockDb.postLikes = this.data.postLikes;
    mockDb.postComments = this.data.postComments;
    mockDb.connectionRequests = this.data.connectionRequests;
    mockDb.connections = this.data.connections;
  }

  // --- POSTS ---

  async getPostsWithAuthors(): Promise<(Post & { author: Profile })[]> {
    // 1. Fetch from live Supabase if connected
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaPosts, error: postErr } = await (supabaseAdmin as any)
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!postErr && supaPosts) {
          const authorIds = Array.from(new Set<string>(supaPosts.map((p: any) => p.author_id)));
          const authorMap: Map<string, Profile> = new Map();

          if (authorIds.length > 0) {
            const { data: supaProfiles } = await supabaseAdmin
              .from("profiles")
              .select("*")
              .in("id", authorIds);

            if (supaProfiles) {
              supaProfiles.forEach((sp: any) => {
                authorMap.set(sp.id, normalizeSupabaseProfile(sp));
              });
            }
          }

          const realPosts: (Post & { author: Profile })[] = supaPosts.map((p: any) => {
            const author =
              authorMap.get(p.author_id) ||
              mockDb.getProfile(p.author_id) ||
              CURATED_PROFILES[p.author_id] ||
              createCuratedProfile({
                id: p.author_id,
                display_name: "VIBE Member",
                username: "vibe_user",
              });

            return {
              id: p.id,
              author_id: p.author_id,
              caption: p.caption || "",
              image_url: p.image_url || null,
              likes_count: p.likes_count || 0,
              comments_count: p.comments_count || 0,
              created_at: p.created_at,
              updated_at: p.updated_at,
              author,
            };
          });

          // Merge any posts from local data (e.g. tests or offline created posts)
          const existingIds = new Set(realPosts.map((rp) => rp.id));
          for (const lp of this.data.posts) {
            if (!existingIds.has(lp.id)) {
              let author =
                authorMap.get(lp.author_id) ||
                mockDb.getProfile(lp.author_id) ||
                CURATED_PROFILES[lp.author_id] ||
                createCuratedProfile({
                  id: lp.author_id,
                  display_name: "VIBE Member",
                  username: "vibe_user",
                });
              realPosts.push({ ...lp, author });
              existingIds.add(lp.id);
            }
          }

          // If fewer than 2 real posts, append curated posts so the feed feels active
          if (realPosts.length < 2) {
            const curatedToAdd = INITIAL_CURATED_POSTS.filter((cp) => !existingIds.has(cp.id)).map((cp) => ({
              ...cp,
              author: CURATED_PROFILES[cp.author_id] || createCuratedProfile({
                id: cp.author_id,
                display_name: "Rotaract 3192",
                username: "rotaract3192",
              }),
            }));
            return [...realPosts, ...curatedToAdd];
          }

          return realPosts;
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getPostsWithAuthors error:", err);
      }
    }

    // 2. Fallback to local / in-memory store
    if (!isTestEnv) {
      this.data = this.loadFromDisk();
    }
    const authorIds = Array.from(new Set(this.data.posts.map((p) => p.author_id)));
    const authorMap: Map<string, Profile> = new Map();

    return this.data.posts.map((p) => {
      let author = authorMap.get(p.author_id) || mockDb.getProfile(p.author_id);

      if (!author && CURATED_PROFILES[p.author_id]) {
        const cp = CURATED_PROFILES[p.author_id];
        author = createCuratedProfile({
          id: cp.id || p.author_id,
          display_name: cp.display_name || "VIBE Member",
          username: cp.username || "vibe_member",
          avatar_url: cp.avatar_url || null,
          rotaract_club: cp.rotaract_club || "Rotaract Club",
          college: cp.college || "District 3192",
          instagram_username: cp.instagram_username || null,
          xp: cp.xp || 500,
        });
      }

      if (!author) {
        author = createCuratedProfile({
          id: p.author_id,
          display_name: "VIBE Member",
          username: "vibe_attendee",
        });
      }

      return {
        ...p,
        author,
      };
    });
  }

  async createPost(
    authorId: string,
    caption: string,
    imageUrl?: string | null
  ): Promise<{ post: Post; xpEarned: number }> {
    let finalImageUrl = imageUrl || null;

    // Handle base64 image upload to Supabase Storage if live
    if (finalImageUrl && finalImageUrl.startsWith("data:image/") && isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const matches = finalImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const ext = contentType.split("/")[1]?.split(";")[0] || "jpeg";
          const buffer = Buffer.from(matches[2], "base64");
          const fileName = `posts/${authorId}-${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
            .from("Vibe Bucket")
            .upload(fileName, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadErr && uploadData?.path) {
            const { data: pubUrl } = supabaseAdmin.storage
              .from("Vibe Bucket")
              .getPublicUrl(uploadData.path);
            if (pubUrl?.publicUrl) {
              finalImageUrl = pubUrl.publicUrl;
            }
          }
        }
      } catch (uploadEx) {
        console.warn("[socialStore] Image storage upload failed, keeping base64 data URL:", uploadEx);
      }
    }

    let post: Post = {
      id: `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      author_id: authorId,
      caption: caption || "",
      image_url: finalImageUrl,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let xpEarned = 0;

    // 1. Supabase live insert (only if authorId is a valid UUID)
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(authorId)) {
      try {
        const { data: inserted, error: insErr } = await (supabaseAdmin as any)
          .from("posts")
          .insert({
            author_id: authorId,
            caption: caption || "",
            image_url: finalImageUrl,
            likes_count: 0,
            comments_count: 0,
          })
          .select("*")
          .single();

        if (!insErr && inserted) {
          post = {
            id: inserted.id,
            author_id: inserted.author_id,
            caption: inserted.caption || "",
            image_url: inserted.image_url || null,
            likes_count: inserted.likes_count || 0,
            comments_count: inserted.comments_count || 0,
            created_at: inserted.created_at,
            updated_at: inserted.updated_at,
          };
        } else if (insErr) {
          console.warn("[socialStore] Supabase insert post error:", insErr);
        }

        // Award XP and increment posts_count
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("posts_count, xp")
          .eq("id", authorId)
          .maybeSingle();

        const currentCount = prof?.posts_count || 0;
        const newCount = currentCount + 1;
        const updates: any = { posts_count: newCount, updated_at: new Date().toISOString() };

        if (currentCount === 0) {
          xpEarned = 50;
          updates.xp = (prof?.xp || 100) + 50;
          await this.createNotification({
            profile_id: authorId,
            type: "xp_earned",
            title: "+50 XP Earned! ⭐",
            message: "First VIBE Post published! 🎉 +50 XP",
            link: "/app",
          });
        } else {
          xpEarned = 20;
          updates.xp = (prof?.xp || 100) + 20;
          await this.createNotification({
            profile_id: authorId,
            type: "xp_earned",
            title: "+20 XP Earned! ⭐",
            message: "Published a VIBE Post! 📸 +20 XP",
            link: "/app",
          });
        }

        await supabaseAdmin.from("profiles").update(updates).eq("id", authorId);
      } catch (err) {
        console.warn("[socialStore] Supabase createPost error:", err);
      }
    }

    // Local fallback XP if not awarded via Supabase
    if (xpEarned === 0) {
      if (!isTestEnv) {
        this.data = this.loadFromDisk();
      }
      const authorPosts = this.data.posts.filter((p) => p.author_id === authorId);
      if (authorPosts.length === 0) {
        xpEarned = 50;
        await this.addXp(authorId, 50, "First VIBE Post published! 🎉 +50 XP");
      } else {
        xpEarned = 20;
        await this.addXp(authorId, 20, "Published a VIBE Post! 📸 +20 XP");
      }
    }

    // 2. Also keep local data in sync
    this.data.posts.unshift(post);
    this.saveToDisk();
    this.syncToMockDb();

    return { post, xpEarned };
  }

  async deletePost(postId: string, authorId: string): Promise<boolean> {
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(authorId)) {
      try {
        await (supabaseAdmin as any)
          .from("posts")
          .delete()
          .eq("id", postId)
          .eq("author_id", authorId);

        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("posts_count")
          .eq("id", authorId)
          .maybeSingle();
        if (prof) {
          await supabaseAdmin
            .from("profiles")
            .update({ posts_count: Math.max(0, (prof.posts_count || 1) - 1) })
            .eq("id", authorId);
        }
      } catch (err) {
        console.warn("[socialStore] Supabase deletePost error:", err);
      }
    }

    if (!isTestEnv) {
      this.data = this.loadFromDisk();
    }
    const idx = this.data.posts.findIndex((p) => p.id === postId && p.author_id === authorId);
    if (idx !== -1) {
      this.data.posts.splice(idx, 1);
    }
    this.data.postLikes = this.data.postLikes.filter((l) => l.post_id !== postId);
    this.data.postComments = this.data.postComments.filter((c) => c.post_id !== postId);

    this.saveToDisk();
    this.syncToMockDb();
    return true;
  }

  // --- LIKES ---

  async toggleLike(
    postId: string,
    profileId: string,
    likerName?: string
  ): Promise<{ liked: boolean; likesCount: number; xpEarned?: number }> {
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        // Check if the post exists in Supabase
        const { data: p } = await (supabaseAdmin as any)
          .from("posts")
          .select("id, likes_count, author_id")
          .eq("id", postId)
          .maybeSingle();

        if (p) {
          const { data: existingLike } = await (supabaseAdmin as any)
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("profile_id", profileId)
            .maybeSingle();

          let liked = false;
          let likesCount = 0;
          let xpEarned = 0;

          if (existingLike) {
            // Unlike
            await (supabaseAdmin as any).from("post_likes").delete().eq("id", existingLike.id);
            likesCount = Math.max(0, (p?.likes_count || 1) - 1);
            await (supabaseAdmin as any).from("posts").update({ likes_count: likesCount }).eq("id", postId);
            liked = false;
          } else {
            // Like
            await (supabaseAdmin as any).from("post_likes").insert({ post_id: postId, profile_id: profileId });
            likesCount = (p?.likes_count || 0) + 1;
            await (supabaseAdmin as any).from("posts").update({ likes_count: likesCount }).eq("id", postId);
            liked = true;
            xpEarned = 5;

            // Award 5 XP to liker
            await this.addXp(profileId, 5, "Liked a post! ❤️ +5 XP");

            // Award 5 XP to author if not self
            if (p?.author_id && p.author_id !== profileId && isUUID(p.author_id)) {
              await this.addXp(p.author_id, 5, "Received a like on your post! ❤️ +5 XP");
              await this.createNotification({
                profile_id: p.author_id,
                type: "post_like",
                title: "New Like on your post! ❤️ (+5 XP)",
                message: `${likerName || "Someone"} liked your post. You earned +5 XP!`,
                link: "/app",
              });
            }
          }

          // Mirror to local memory and disk
          if (!isTestEnv) {
            this.data = this.loadFromDisk();
          }
          const localPost = this.data.posts.find((lp) => lp.id === postId);
          if (localPost) {
            localPost.likes_count = likesCount;
          }
          if (liked) {
            if (!this.data.postLikes.some((l) => l.post_id === postId && l.profile_id === profileId)) {
              this.data.postLikes.push({
                id: `like-${Date.now()}`,
                post_id: postId,
                profile_id: profileId,
                created_at: new Date().toISOString(),
              });
            }
          } else {
            this.data.postLikes = this.data.postLikes.filter(
              (l) => !(l.post_id === postId && l.profile_id === profileId)
            );
          }
          this.saveToDisk();
          this.syncToMockDb();

          return { liked, likesCount, xpEarned };
        }
      } catch (err) {
        console.warn("[socialStore] Supabase toggleLike error:", err);
      }
    }

    // Local fallback
    if (!isTestEnv) {
      this.data = this.loadFromDisk();
    }
    let post = this.data.posts.find((p) => p.id === postId);
    if (!post) {
      post = mockDb.posts.find((p) => p.id === postId);
    }
    if (!post) throw new Error("Post not found");

    if (!this.data.awardedLikeXp) {
      this.data.awardedLikeXp = [];
    }

    const likeIdx = this.data.postLikes.findIndex((l) => l.post_id === postId && l.profile_id === profileId);
    let liked = false;
    let xpEarned = 0;

    if (likeIdx !== -1) {
      this.data.postLikes.splice(likeIdx, 1);
      post.likes_count = Math.max(0, post.likes_count - 1);
      liked = false;
    } else {
      this.data.postLikes.push({
        id: `like-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        post_id: postId,
        profile_id: profileId,
        created_at: new Date().toISOString(),
      });
      post.likes_count += 1;
      liked = true;

      const xpKey = `${postId}:${profileId}`;
      const isFirstLike = !this.data.awardedLikeXp.includes(xpKey);

      if (isFirstLike) {
        this.data.awardedLikeXp.push(xpKey);
        xpEarned = 5;
        await this.addXp(profileId, 5, "Liked a post! ❤️ +5 XP");
        if (post.author_id !== profileId) {
          await this.addXp(post.author_id, 5, "Received a like on your post! ❤️ +5 XP");
        }
      }

      if (post.author_id !== profileId) {
        await this.createNotification({
          profile_id: post.author_id,
          type: "post_like",
          title: "New Like on your post! ❤️ (+5 XP)",
          message: `${likerName || "Someone"} liked your post. You earned +5 XP!`,
          link: "/app",
        });
      }
    }

    this.saveToDisk();
    this.syncToMockDb();
    return { liked, likesCount: post.likes_count, xpEarned };
  }

  hasUserLiked(postId: string, profileId: string): boolean {
    return this.data.postLikes.some((l) => l.post_id === postId && l.profile_id === profileId);
  }

  async getUserLikedPostIds(profileId: string): Promise<string[]> {
    const likedSet = new Set<string>();

    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: likes } = await (supabaseAdmin as any)
          .from("post_likes")
          .select("post_id")
          .eq("profile_id", profileId);

        if (likes) {
          likes.forEach((l: any) => likedSet.add(l.post_id));
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getUserLikedPostIds error:", err);
      }
    }

    // Merge with local likes
    this.data.postLikes
      .filter((l) => l.profile_id === profileId)
      .forEach((l) => likedSet.add(l.post_id));

    return Array.from(likedSet);
  }

  getUserPosts(profileId: string): Post[] {
    return this.data.posts.filter((p) => p.author_id === profileId);
  }

  async getUserPostsAsync(profileId: string): Promise<Post[]> {
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: posts } = await (supabaseAdmin as any)
          .from("posts")
          .select("*")
          .eq("author_id", profileId)
          .order("created_at", { ascending: false });

        if (posts) {
          const supaPosts: Post[] = posts.map((p: any) => ({
            id: p.id,
            author_id: p.author_id,
            caption: p.caption || "",
            image_url: p.image_url || null,
            likes_count: p.likes_count || 0,
            comments_count: p.comments_count || 0,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));

          const existingIds = new Set(supaPosts.map((p) => p.id));
          const localPosts = this.getUserPosts(profileId).filter((p) => !existingIds.has(p.id));
          return [...supaPosts, ...localPosts];
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getUserPostsAsync error:", err);
      }
    }

    return this.getUserPosts(profileId);
  }

  getUserComments(profileId: string): PostComment[] {
    return this.data.postComments.filter((c) => c.profile_id === profileId);
  }

  getUserLikes(profileId: string): PostLike[] {
    return this.data.postLikes.filter((l) => l.profile_id === profileId);
  }

  eraseUserData(profileId: string) {
    this.data.posts = this.data.posts.filter((p) => p.author_id !== profileId);
    this.data.postComments = this.data.postComments.filter((c) => c.profile_id !== profileId);
    this.data.postLikes = this.data.postLikes.filter((l) => l.profile_id !== profileId);
    this.data.connectionRequests = this.data.connectionRequests.filter(
      (r) => r.sender_id !== profileId && r.receiver_id !== profileId
    );
    this.data.connections = this.data.connections.filter(
      (c) => c.user_id_1 !== profileId && c.user_id_2 !== profileId
    );
    if (this.data.awardedLikeXp) {
      this.data.awardedLikeXp = this.data.awardedLikeXp.filter(
        (key) => !key.endsWith(`:${profileId}`) && !key.startsWith(`${profileId}:`)
      );
    }
    this.saveToDisk();
    this.syncToMockDb();
  }

  // --- COMMENTS ---

  async getPostComments(postId: string): Promise<{ id: string; authorName: string; authorAvatar?: string; comment: string; createdAt: string }[]> {
    const commentsList: { id: string; authorName: string; authorAvatar?: string; comment: string; createdAt: string }[] = [];
    const seenIds = new Set<string>();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: comments } = await (supabaseAdmin as any)
          .from("post_comments")
          .select("id, post_id, profile_id, comment, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (comments && comments.length > 0) {
          const profileIds = Array.from(new Set<string>(comments.map((c: any) => c.profile_id))).filter(isUUID);
          const { data: profiles } = profileIds.length > 0
            ? await supabaseAdmin.from("profiles").select("*").in("id", profileIds)
            : { data: [] };
          const profMap = new Map<string, Profile>();
          if (profiles) {
            profiles.forEach((p: any) => profMap.set(p.id, normalizeSupabaseProfile(p)));
          }

          comments.forEach((c: any) => {
            const author = profMap.get(c.profile_id) || mockDb.getProfile(c.profile_id);
            commentsList.push({
              id: c.id,
              authorName: author?.display_name || "VIBE Member",
              authorAvatar: author?.avatar_url || undefined,
              comment: c.comment,
              createdAt: c.created_at,
            });
            seenIds.add(c.id);
          });
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getPostComments error:", err);
      }
    }

    if (!isTestEnv) {
      this.data = this.loadFromDisk();
    }
    const localComments = this.data.postComments.filter((c) => c.post_id === postId);
    for (const c of localComments) {
      if (!seenIds.has(c.id)) {
        const author = mockDb.getProfile(c.profile_id) || CURATED_PROFILES[c.profile_id];
        commentsList.push({
          id: c.id,
          authorName: author?.display_name || "VIBE Member",
          authorAvatar: author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.profile_id)}`,
          comment: c.comment,
          createdAt: c.created_at,
        });
        seenIds.add(c.id);
      }
    }

    return commentsList;
  }

  async addComment(
    postId: string,
    profileId: string,
    commentText: string,
    commenterName?: string
  ): Promise<{ success: boolean; comment: PostComment; commentsCount: number }> {
    let commentsCount = 1;
    let commentId = `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let createdAt = new Date().toISOString();

    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: p } = await (supabaseAdmin as any)
          .from("posts")
          .select("comments_count, author_id")
          .eq("id", postId)
          .maybeSingle();

        if (p) {
          const { data: inserted } = await (supabaseAdmin as any)
            .from("post_comments")
            .insert({
              post_id: postId,
              profile_id: profileId,
              comment: commentText,
            })
            .select("*")
            .single();

          if (inserted?.id) {
            commentId = inserted.id;
            createdAt = inserted.created_at || createdAt;
          }

          commentsCount = (p.comments_count || 0) + 1;
          await (supabaseAdmin as any).from("posts").update({ comments_count: commentsCount }).eq("id", postId);

          if (p.author_id && p.author_id !== profileId && isUUID(p.author_id)) {
            await this.createNotification({
              profile_id: p.author_id,
              type: "post_comment",
              title: "New Comment on your post 💬",
              message: `${commenterName || "Someone"} commented: "${commentText.slice(0, 60)}${commentText.length > 60 ? "..." : ""}"`,
              link: "/app",
            });
          }
        }
      } catch (err) {
        console.warn("[socialStore] Supabase addComment error:", err);
      }
    }

    const comment: PostComment = {
      id: commentId,
      post_id: postId,
      profile_id: profileId,
      comment: commentText,
      created_at: createdAt,
    };

    if (!isTestEnv) {
      this.data = this.loadFromDisk();
    }
    const post = this.data.posts.find((p) => p.id === postId);
    if (post) {
      post.comments_count += 1;
      commentsCount = post.comments_count;
    }

    this.data.postComments.push(comment);
    this.saveToDisk();
    this.syncToMockDb();

    if (post && post.author_id !== profileId && !isUsingLiveSupabase()) {
      await this.createNotification({
        profile_id: post.author_id,
        type: "post_comment",
        title: "New Comment on your post 💬",
        message: `${commenterName || "Someone"} commented: "${commentText.slice(0, 60)}${commentText.length > 60 ? "..." : ""}"`,
        link: "/app",
      });
    }

    // Award XP for genuine interaction: +10 XP to commenter, +5 XP to post author
    await this.addXp(profileId, 10, "Commented on a VIBE post! 💬 +10 XP");
    const targetAuthorId = post?.author_id;
    if (targetAuthorId && targetAuthorId !== profileId) {
      await this.addXp(targetAuthorId, 5, "Received a comment on your post! 💬 +5 XP");
    }

    return { success: true, comment, commentsCount };
  }

  // --- CONNECTIONS & REQUESTS ---

  async sendConnectionRequest(senderId: string, receiverId: string, senderName?: string, senderClub?: string) {
    if (senderId === receiverId) {
      return { success: false, message: "Cannot connect with yourself." };
    }

    const existingReq = this.data.connectionRequests.find(
      (r) =>
        r.status === "pending" &&
        ((r.sender_id === senderId && r.receiver_id === receiverId) ||
          (r.sender_id === receiverId && r.receiver_id === senderId))
    );

    if (existingReq) {
      return { success: false, message: "A connection request is already pending." };
    }

    const isAlreadyConnected = this.data.connections.some(
      (c) =>
        (c.user_id_1 === senderId && c.user_id_2 === receiverId) ||
        (c.user_id_1 === receiverId && c.user_id_2 === senderId)
    );

    if (isAlreadyConnected) {
      return { success: false, message: "You are already connected with this attendee." };
    }

    let reqId = `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const nowIso = new Date().toISOString();

    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(senderId) && isUUID(receiverId)) {
      try {
        const { data: insReq } = await (supabaseAdmin as any)
          .from("connection_requests")
          .upsert(
            {
              sender_id: senderId,
              receiver_id: receiverId,
              status: "pending",
              updated_at: nowIso,
            },
            { onConflict: "sender_id,receiver_id" }
          )
          .select("*")
          .single();

        if (insReq?.id) {
          reqId = insReq.id;
        }
      } catch (err) {
        console.warn("[socialStore] Supabase sendConnectionRequest error:", err);
      }
    }

    const req: ConnectionRequest = {
      id: reqId,
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.data.connectionRequests.unshift(req);

    // Send real notification to receiver in Supabase & Store
    await this.createNotification({
      profile_id: receiverId,
      type: "connection_request",
      title: "New Connection Request! 👋",
      message: `${senderName || "A fellow attendee"}${senderClub ? ` from ${senderClub}` : ""} wants to connect with you.`,
      link: "/app/friends",
    });

    this.saveToDisk();
    this.syncToMockDb();

    return { success: true, request: req };
  }

  async respondConnectionRequest(
    requestId: string,
    currentUserId: string,
    action: "accept" | "decline",
    responderName?: string
  ) {
    // ── Supabase path ─────────────────────────────────────────
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(currentUserId)) {
      try {
        // 1. Look up the request in Supabase
        const { data: req } = await (supabaseAdmin as any)
          .from("connection_requests")
          .select("*")
          .eq("id", requestId)
          .eq("receiver_id", currentUserId)
          .eq("status", "pending")
          .maybeSingle();

        if (req) {
          // 2. Update status in Supabase
          await (supabaseAdmin as any)
            .from("connection_requests")
            .update({ status: action === "accept" ? "accepted" : "declined", updated_at: new Date().toISOString() })
            .eq("id", requestId);

          if (action === "accept") {
            // 3. Create connection row in Supabase
            await (supabaseAdmin as any).from("connections").upsert(
              {
                user_id_1: req.sender_id,
                user_id_2: req.receiver_id,
                connected_at: new Date().toISOString(),
              },
              { onConflict: "user_id_1,user_id_2" }
            );

            // 4. Also mirror into local store for the same session
            const conn: Connection = {
              id: `conn-${Date.now()}`,
              user_id_1: req.sender_id,
              user_id_2: req.receiver_id,
              connected_at: new Date().toISOString(),
            };
            this.data.connections.push(conn);

            // 5. Award XP to both
            await this.addXp(req.sender_id, 25, "Connected with a new attendee! +25 XP");
            await this.addXp(req.receiver_id, 25, "Connected with a new attendee! +25 XP");

            // 6. Update connections_count
            for (const uid of [req.sender_id, req.receiver_id]) {
              try {
                const { data: prof } = await supabaseAdmin.from("profiles").select("connections_count").eq("id", uid).single();
                if (prof) {
                  await supabaseAdmin.from("profiles").update({ connections_count: (prof.connections_count || 0) + 1 }).eq("id", uid);
                }
              } catch { /* ignore */ }
            }

            // 7. Notify sender
            await this.createNotification({
              profile_id: req.sender_id,
              type: "connection_accepted",
              title: "Connection Accepted! 🎉",
              message: `${responderName || "User"} accepted your connection request!`,
              link: `/app/profile?id=${req.receiver_id}`,
            });
          }

          // Sync local request status too
          const localReq = this.data.connectionRequests.find((r) => r.id === requestId);
          if (localReq) {
            localReq.status = action === "accept" ? "accepted" : "declined";
            localReq.updated_at = new Date().toISOString();
          }

          this.saveToDisk();
          this.syncToMockDb();
          return { success: true, status: action === "accept" ? "accepted" : "declined" };
        }
      } catch (err) {
        console.warn("[respondConnection] Supabase error, falling back to in-memory:", err);
      }
    }

    // ── Fallback: in-memory / file store ──────────────────────
    const req = this.data.connectionRequests.find((r) => r.id === requestId);
    if (!req || req.receiver_id !== currentUserId || req.status !== "pending") {
      return { success: false, message: "Invalid or expired connection request." };
    }

    req.status = action === "accept" ? "accepted" : "declined";
    req.updated_at = new Date().toISOString();

    if (action === "accept") {
      const conn: Connection = {
        id: `conn-${Date.now()}`,
        user_id_1: req.sender_id,
        user_id_2: req.receiver_id,
        connected_at: new Date().toISOString(),
      };
      this.data.connections.push(conn);

      await this.addXp(req.sender_id, 25, "Connected with a new attendee! +25 XP");
      await this.addXp(req.receiver_id, 25, "Connected with a new attendee! +25 XP");

      await this.createNotification({
        profile_id: req.sender_id,
        type: "connection_accepted",
        title: "Connection Accepted! 🎉",
        message: `${responderName || "User"} accepted your connection request!`,
        link: `/app/profile?id=${req.receiver_id}`,
      });

      // Update connections_count in Supabase if live
      if (isUsingLiveSupabase() && supabaseAdmin && isUUID(req.sender_id) && isUUID(req.receiver_id)) {
        try {
          for (const uid of [req.sender_id, req.receiver_id]) {
            const { data: prof } = await supabaseAdmin.from("profiles").select("connections_count").eq("id", uid).single();
            if (prof) {
              await supabaseAdmin.from("profiles").update({ connections_count: (prof.connections_count || 0) + 1 }).eq("id", uid);
            }
          }
        } catch (err) {
          console.warn("Supabase connections_count update error:", err);
        }
      }
    }

    this.saveToDisk();
    this.syncToMockDb();

    return { success: true, status: req.status };
  }

  getConnectionRequests(profileId: string): {
    incoming: { request: ConnectionRequest; sender?: Profile }[];
    outgoing: { request: ConnectionRequest; receiver?: Profile }[];
  } {
    const incoming: { request: ConnectionRequest; sender?: Profile }[] = this.data.connectionRequests
      .filter((r) => r.receiver_id === profileId && r.status === "pending")
      .map((r) => ({
        request: r,
        sender: mockDb.getProfile(r.sender_id) || CURATED_PROFILES[r.sender_id] || undefined,
      }));

    const outgoing: { request: ConnectionRequest; receiver?: Profile }[] = this.data.connectionRequests
      .filter((r) => r.sender_id === profileId && r.status === "pending")
      .map((r) => ({
        request: r,
        receiver: mockDb.getProfile(r.receiver_id) || CURATED_PROFILES[r.receiver_id] || undefined,
      }));

    return { incoming, outgoing };
  }

  async getConnectionRequestsAsync(profileId: string): Promise<{
    incoming: { request: ConnectionRequest; sender?: Profile }[];
    outgoing: { request: ConnectionRequest; receiver?: Profile }[];
  }> {
    const incoming: { request: ConnectionRequest; sender?: Profile }[] = [];
    const outgoing: { request: ConnectionRequest; receiver?: Profile }[] = [];
    const seenReqIds = new Set<string>();

    // ── Supabase path ──────────────────────────────────────────
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: rows } = await (supabaseAdmin as any)
          .from("connection_requests")
          .select("*")
          .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (rows) {
          const incomingRows = rows.filter((r: any) => r.receiver_id === profileId);
          const outgoingRows = rows.filter((r: any) => r.sender_id === profileId);

          // Batch-fetch sender profiles
          const senderIds = Array.from(new Set<string>(incomingRows.map((r: any) => r.sender_id as string))).filter(isUUID);
          const receiverIds = Array.from(new Set<string>(outgoingRows.map((r: any) => r.receiver_id as string))).filter(isUUID);
          const allIds = Array.from(new Set<string>([...senderIds, ...receiverIds]));

          let profileMap: Map<string, Profile> = new Map();
          if (allIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
              .from("profiles")
              .select("*")
              .in("id", allIds);
            if (profiles) {
              profiles.forEach((sp: any) =>
                profileMap.set(sp.id, normalizeSupabaseProfile(sp))
              );
            }
          }

          incomingRows.forEach((r: any) => {
            const reqObj: ConnectionRequest = {
              id: r.id,
              sender_id: r.sender_id,
              receiver_id: r.receiver_id,
              status: r.status,
              created_at: r.created_at,
              updated_at: r.updated_at,
            };
            incoming.push({
              request: reqObj,
              sender: profileMap.get(r.sender_id) || mockDb.getProfile(r.sender_id),
            });
            seenReqIds.add(r.id);
          });

          outgoingRows.forEach((r: any) => {
            const reqObj: ConnectionRequest = {
              id: r.id,
              sender_id: r.sender_id,
              receiver_id: r.receiver_id,
              status: r.status,
              created_at: r.created_at,
              updated_at: r.updated_at,
            };
            outgoing.push({
              request: reqObj,
              receiver: profileMap.get(r.receiver_id) || mockDb.getProfile(r.receiver_id),
            });
            seenReqIds.add(r.id);
          });
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getConnectionRequestsAsync error:", err);
      }
    }

    // ── Fallback & Merge: in-memory / file store ──────────────────────
    const raw = this.getConnectionRequests(profileId);
    for (const item of raw.incoming) {
      if (!seenReqIds.has(item.request.id)) {
        let sender = item.sender;
        if (!sender) {
          sender = (await getProfileByIdOrClerkId(item.request.sender_id)) || undefined;
        }
        incoming.push({ request: item.request, sender });
        seenReqIds.add(item.request.id);
      }
    }

    for (const item of raw.outgoing) {
      if (!seenReqIds.has(item.request.id)) {
        let receiver = item.receiver;
        if (!receiver) {
          receiver = (await getProfileByIdOrClerkId(item.request.receiver_id)) || undefined;
        }
        outgoing.push({ request: item.request, receiver });
        seenReqIds.add(item.request.id);
      }
    }

    return { incoming, outgoing };
  }

  getConnections(profileId: string): Profile[] {
    const connectedIds = this.data.connections
      .filter((c) => c.user_id_1 === profileId || c.user_id_2 === profileId)
      .map((c) => (c.user_id_1 === profileId ? c.user_id_2 : c.user_id_1));

    return connectedIds
      .map((id) => mockDb.getProfile(id) || (CURATED_PROFILES[id] as Profile))
      .filter((p): p is Profile => p !== undefined);
  }

  async getConnectionsAsync(profileId: string): Promise<Profile[]> {
    const connectedMap: Map<string, Profile> = new Map();

    // ── Supabase path (source of truth when live) ───────────────
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        // Fetch all connection rows where user is either side
        const { data: connRows } = await (supabaseAdmin as any)
          .from("connections")
          .select("user_id_1, user_id_2")
          .or(`user_id_1.eq.${profileId},user_id_2.eq.${profileId}`);

        if (connRows && connRows.length > 0) {
          const connectedIds: string[] = connRows
            .map((r: any) => (r.user_id_1 === profileId ? r.user_id_2 : r.user_id_1))
            .filter(isUUID);

          if (connectedIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
              .from("profiles")
              .select("*")
              .in("id", connectedIds);

            if (profiles) {
              profiles.forEach((sp: any) => {
                const norm = normalizeSupabaseProfile(sp);
                connectedMap.set(norm.id, norm);
              });
            }
          }
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getConnectionsAsync error:", err);
      }
    }

    // ── Fallback & Merge: in-memory / file store ───────────────────────
    const localConnected = this.getConnections(profileId);
    for (const p of localConnected) {
      if (!connectedMap.has(p.id)) {
        connectedMap.set(p.id, p);
      }
    }

    const connectedIdsFromData = this.data.connections
      .filter((c) => c.user_id_1 === profileId || c.user_id_2 === profileId)
      .map((c) => (c.user_id_1 === profileId ? c.user_id_2 : c.user_id_1));

    for (const cid of connectedIdsFromData) {
      if (!connectedMap.has(cid)) {
        const prof = (await getProfileByIdOrClerkId(cid)) || mockDb.getProfile(cid);
        if (prof) {
          connectedMap.set(prof.id, prof);
        }
      }
    }

    return Array.from(connectedMap.values());
  }

  async getConnectionStatusAsync(
    senderId: string,
    receiverId: string
  ): Promise<"connected" | "pending_sent" | "pending_received" | "none"> {
    if (!senderId || !receiverId || senderId === receiverId) return "none";

    // 1. Supabase check if live
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(senderId) && isUUID(receiverId)) {
      try {
        // Check if user_id_1 = sender, user_id_2 = receiver
        let { data: conn } = await supabaseAdmin
          .from("connections")
          .select("id")
          .match({ user_id_1: senderId, user_id_2: receiverId })
          .maybeSingle();
        
        if (conn) return "connected";

        // Check if user_id_1 = receiver, user_id_2 = sender
        let { data: conn2 } = await supabaseAdmin
          .from("connections")
          .select("id")
          .match({ user_id_1: receiverId, user_id_2: senderId })
          .maybeSingle();
          
        if (conn2) return "connected";

        // Check pending requests where sender sent it
        const { data: req1 } = await supabaseAdmin
          .from("connection_requests")
          .select("sender_id, receiver_id, status")
          .match({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
          .maybeSingle();

        if (req1) return "pending_sent";

        // Check pending requests where receiver sent it
        const { data: req2 } = await supabaseAdmin
          .from("connection_requests")
          .select("sender_id, receiver_id, status")
          .match({ sender_id: receiverId, receiver_id: senderId, status: "pending" })
          .maybeSingle();

        if (req2) return "pending_received";

      } catch (err) {
        console.warn("[socialStore] Supabase getConnectionStatusAsync error:", err);
      }
    }

    // 2. Check in-memory store
    return mockDb.getConnectionStatus(senderId, receiverId);
  }

  async getUserConnectionMapAsync(
    userId: string
  ): Promise<Record<string, "connected" | "pending" | "none">> {
    const map: Record<string, "connected" | "pending" | "none"> = {};
    if (!userId) return map;

    // 1. Supabase check
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(userId)) {
      try {
        const { data: conns } = await (supabaseAdmin as any)
          .from("connections")
          .select("user_id_1, user_id_2")
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

        if (conns) {
          conns.forEach((c: any) => {
            const other = c.user_id_1 === userId ? c.user_id_2 : c.user_id_1;
            map[other] = "connected";
          });
        }

        const { data: reqs } = await (supabaseAdmin as any)
          .from("connection_requests")
          .select("sender_id, receiver_id, status")
          .eq("status", "pending")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (reqs) {
          reqs.forEach((r: any) => {
            const other = r.sender_id === userId ? r.receiver_id : r.sender_id;
            if (!map[other]) {
              map[other] = "pending";
            }
          });
        }
      } catch (err) {
        console.warn("[socialStore] Supabase getUserConnectionMapAsync error:", err);
      }
    }

    // 2. Merge local
    this.data.connections.forEach((c) => {
      if (c.user_id_1 === userId) map[c.user_id_2] = "connected";
      if (c.user_id_2 === userId) map[c.user_id_1] = "connected";
    });
    mockDb.connections.forEach((c) => {
      if (c.user_id_1 === userId) map[c.user_id_2] = "connected";
      if (c.user_id_2 === userId) map[c.user_id_1] = "connected";
    });

    this.data.connectionRequests.forEach((r) => {
      if (r.status === "pending") {
        if (r.sender_id === userId && !map[r.receiver_id]) map[r.receiver_id] = "pending";
        if (r.receiver_id === userId && !map[r.sender_id]) map[r.sender_id] = "pending";
      }
    });
    mockDb.connectionRequests.forEach((r) => {
      if (r.status === "pending") {
        if (r.sender_id === userId && !map[r.receiver_id]) map[r.receiver_id] = "pending";
        if (r.receiver_id === userId && !map[r.sender_id]) map[r.sender_id] = "pending";
      }
    });

    return map;
  }

  // --- NOTIFICATIONS (SUPABASE + LOCAL) ---

  async createNotification(notif: {
    profile_id: string;
    type: Notification["type"];
    title: string;
    message: string;
    link?: string | null;
  }) {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      profile_id: notif.profile_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      link: notif.link || null,
      created_at: new Date().toISOString(),
    };

    mockDb.notifications.unshift(newNotif);

    // Sync to Supabase notifications table if live!
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(notif.profile_id)) {
      try {
        const eventId = "a0000000-0000-0000-0000-000000000001";
        await supabaseAdmin.from("notifications").insert({
          event_id: eventId,
          profile_id: notif.profile_id,
          type: notif.type,
          title: notif.title,
          body: notif.message,
          read_at: null,
        });
      } catch (err) {
        console.warn("Supabase notification insert warning:", err);
      }
    }

    return newNotif;
  }

  async getNotifications(profileId: string): Promise<Notification[]> {
    // 1. Check live Supabase first
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: supaNotifs } = await supabaseAdmin
          .from("notifications")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(30);

        if (supaNotifs && supaNotifs.length > 0) {
          return supaNotifs.map((n: any) => ({
            id: n.id,
            profile_id: n.profile_id,
            title: n.title,
            message: n.body || n.message || "",
            type: n.type,
            read: Boolean(n.read_at),
            link: n.link || (n.type === "connection_request" ? "/app/friends" : "/app"),
            created_at: n.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase notification read warning:", err);
      }
    }

    // Fallback to in-memory notifications
    return mockDb.getNotifications(profileId);
  }

  async markAllNotificationsRead(profileId: string) {
    mockDb.markNotificationsRead(profileId);

    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        await supabaseAdmin
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("profile_id", profileId)
          .is("read_at", null);
      } catch (err) {
        console.warn("Supabase mark read error:", err);
      }
    }
  }

  // --- XP SYSTEM ---

  async addXp(profileId: string, amount: number, reason: string): Promise<number> {
    // 1. Update mockDb
    mockDb.addXpToProfile(profileId, amount, reason);

    // 2. Update Supabase profiles table
    let newXp = 0;
    if (isUsingLiveSupabase() && supabaseAdmin && isUUID(profileId)) {
      try {
        const { data: p } = await supabaseAdmin
          .from("profiles")
          .select("xp")
          .eq("id", profileId)
          .single();

        if (p) {
          newXp = (p.xp || 0) + amount;
          await supabaseAdmin
            .from("profiles")
            .update({ xp: newXp, updated_at: new Date().toISOString() })
            .eq("id", profileId);
        }
      } catch (err) {
        console.warn("Supabase addXp error:", err);
      }
    }

    return newXp;
  }

  resetForTesting() {
    this.data = {
      posts: [...INITIAL_CURATED_POSTS],
      postLikes: [],
      postComments: [...INITIAL_CURATED_COMMENTS],
      connectionRequests: [],
      connections: [],
      awardedLikeXp: [],
    };
    this.saveToDisk();
    this.syncToMockDb();
  }
}

export const socialStore = new PersistentSocialStore();
