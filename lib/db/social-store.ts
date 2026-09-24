import fs from "fs";
import path from "path";
import { Post, PostLike, PostComment, ConnectionRequest, Connection, Profile, Notification } from "@/types/database";
import { isUsingLiveSupabase, supabaseAdmin } from "./supabase";
import { mockDb } from "./mock-store";
import { getProfileByIdOrClerkId } from "./profiles";

interface SocialStoreData {
  posts: Post[];
  postLikes: PostLike[];
  postComments: PostComment[];
  connectionRequests: ConnectionRequest[];
  connections: Connection[];
}

const TMP_DIR = path.join(process.cwd(), ".tmp");
const STORAGE_FILE = path.join(TMP_DIR, "vibe-social.json");

// Default initial curated posts from Rotaract District 3192 so the feed is never dead
const INITIAL_CURATED_POSTS: Post[] = [
  {
    id: "post-seed-1",
    author_id: "prof-curated-1",
    caption: "Welcome to VIBE 2026! 🎉 The pre-event social hub is officially live. Connect with fellow delegates, play arcade games, and get ready for the biggest fresher festival in District 3192! #VIBE2026 #Rotaract3192",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    likes_count: 18,
    comments_count: 4,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "post-seed-2",
    author_id: "prof-curated-2",
    caption: "Who else has tried the Minion Game and Memory Match? Just scored 850 PTS in the arcade arena! Drop your high scores below 🔥🎮",
    image_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
    likes_count: 12,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "post-seed-3",
    author_id: "prof-curated-3",
    caption: "Can't wait to meet everyone at ROCCO '26! Sending connection requests to all delegates from Bangalore colleges. Let's connect! 🤝✨",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
    likes_count: 24,
    comments_count: 3,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const INITIAL_CURATED_COMMENTS: PostComment[] = [
  {
    id: "cmt-seed-1",
    post_id: "post-seed-1",
    profile_id: "prof-curated-2",
    comment: "Super excited for this! Just registered my profile.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "cmt-seed-2",
    post_id: "post-seed-1",
    profile_id: "prof-curated-3",
    comment: "See you all at the festival stage! 🎵",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "cmt-seed-3",
    post_id: "post-seed-2",
    profile_id: "prof-curated-1",
    comment: "Just hit 1000 PTS on Minion Game! Best score so far.",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

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

const CURATED_PROFILES: Record<string, Profile> = {
  "prof-curated-1": createCuratedProfile({
    id: "prof-curated-1",
    display_name: "Rotaract 3192 Team",
    username: "rotaract_district3192",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DistrictTeam",
    college: "Rotaract District 3192",
    rotaract_club: "District Council",
    instagram_username: "rotaract3192",
    xp: 2500,
    level_number: 6,
    level_name: "VIBE LEGEND",
  }),
  "prof-curated-2": createCuratedProfile({
    id: "prof-curated-2",
    display_name: "Aarav Sharma",
    username: "aarav_vibe",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
    college: "RV College of Engineering",
    rotaract_club: "RC Koramangala",
    instagram_username: "aarav.sharma",
    xp: 950,
    level_number: 3,
    level_name: "VIBE SEEKER",
  }),
  "prof-curated-3": createCuratedProfile({
    id: "prof-curated-3",
    display_name: "Ananya Rao",
    username: "ananya_r",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
    college: "PES University",
    rotaract_club: "RC Bangalore South",
    instagram_username: "ananya.rao",
    xp: 1400,
    level_number: 4,
    level_name: "VIBE RIDER",
  }),
};

class PersistentSocialStore {
  private data: SocialStoreData;

  constructor() {
    this.data = this.loadFromDisk();
    this.syncToMockDb();
  }

  private loadFromDisk(): SocialStoreData {
    try {
      if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
      }

      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.posts)) {
          return {
            posts: parsed.posts || [],
            postLikes: parsed.postLikes || [],
            postComments: parsed.postComments || [],
            connectionRequests: parsed.connectionRequests || [],
            connections: parsed.connections || [],
          };
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
    };
  }

  private saveToDisk() {
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
    // Collect all author IDs
    const authorIds = Array.from(new Set(this.data.posts.map((p) => p.author_id)));
    const authorMap: Map<string, Profile> = new Map();

    // 1. Fetch from Supabase if live
    if (isUsingLiveSupabase() && supabaseAdmin && authorIds.length > 0) {
      try {
        const { data: supaProfiles } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .in("id", authorIds);

        if (supaProfiles) {
          supaProfiles.forEach((sp: any) => {
            authorMap.set(sp.id, {
              id: sp.id,
              clerk_user_id: sp.clerk_user_id || "",
              vibe_id: sp.vibe_id || "VB-ATTENDEE",
              display_name: sp.display_name || "VIBE Member",
              username: sp.username || "vibe_user",
              avatar_url: sp.avatar_url,
              email: sp.email || "",
              phone: sp.phone || "",
              rotaract_club: sp.club || sp.rotaract_club || "Rotaract District 3192",
              college: sp.college || "College",
              course_year: sp.course_year || "Student",
              instagram_username: sp.instagram_id || sp.instagram_username || null,
              bio: sp.bio || null,
              interests: sp.interests || [],
              skills: sp.skills || [],
              hobbies: sp.hobbies || [],
              city: sp.city || null,
              is_discoverable: sp.is_discoverable ?? true,
              xp: sp.xp || 100,
              level_number: sp.level_number || 1,
              level_name: sp.level_name || "VIBE NEWBIE",
              connections_count: sp.connections_count || 0,
              posts_count: sp.posts_count || 0,
              games_played_count: sp.games_played_count || 0,
              profile_completed: sp.profile_completed ?? true,
              created_at: sp.created_at || new Date().toISOString(),
              updated_at: sp.updated_at || new Date().toISOString(),
            });
          });
        }
      } catch (err) {
        console.warn("Supabase author profile batch fetch error:", err);
      }
    }

    return this.data.posts.map((p) => {
      let author = authorMap.get(p.author_id) || mockDb.getProfile(p.author_id);

      // Check curated profiles
      if (!author && CURATED_PROFILES[p.author_id]) {
        const cp = CURATED_PROFILES[p.author_id];
        author = {
          id: cp.id || p.author_id,
          clerk_user_id: "",
          vibe_id: "VB-VIP",
          display_name: cp.display_name || "VIBE Member",
          username: cp.username || "vibe_member",
          avatar_url: cp.avatar_url || null,
          email: "",
          phone: "",
          rotaract_club: cp.rotaract_club || "Rotaract Club",
          college: cp.college || "District 3192",
          course_year: "Leader",
          instagram_username: cp.instagram_username || null,
          bio: "Rotaract District 3192 VIP",
          interests: ["Music", "Festivals"],
          is_discoverable: true,
          xp: cp.xp || 500,
          level_number: 3,
          level_name: "VIBE SEEKER",
          connections_count: 10,
          posts_count: 5,
          games_played_count: 12,
          profile_completed: true,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      }

      if (!author) {
        author = {
          id: p.author_id,
          clerk_user_id: "",
          vibe_id: "VB-ATTENDEE",
          display_name: "VIBE Member",
          username: "vibe_attendee",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.author_id)}`,
          email: "",
          phone: "",
          rotaract_club: "Rotaract District 3192",
          college: "Bengaluru College",
          course_year: "Student",
          instagram_username: null,
          bio: null,
          interests: [],
          is_discoverable: true,
          xp: 100,
          level_number: 1,
          level_name: "VIBE NEWBIE",
          connections_count: 0,
          posts_count: 1,
          games_played_count: 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
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
    const post: Post = {
      id: `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      author_id: authorId,
      caption: caption || "",
      image_url: imageUrl || null,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.posts.unshift(post);

    // Count author posts to award First Post XP (+50 XP)
    const authorPosts = this.data.posts.filter((p) => p.author_id === authorId);
    let xpEarned = 0;
    if (authorPosts.length === 1) {
      xpEarned = 50;
      // Award XP to profile
      await this.addXp(authorId, 50, "First VIBE Post published! 🎉 +50 XP");
    }

    this.saveToDisk();
    this.syncToMockDb();

    // Increment posts_count in Supabase if live
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const admin = supabaseAdmin;
      try {
        const { data: prof } = await admin.from("profiles").select("posts_count").eq("id", authorId).single();
        if (prof) {
          await admin.from("profiles").update({ posts_count: (prof.posts_count || 0) + 1 }).eq("id", authorId);
        }
      } catch (err) {
        console.warn("Supabase post count update warning:", err);
      }
    }

    return { post, xpEarned };
  }

  deletePost(postId: string, authorId: string): boolean {
    const idx = this.data.posts.findIndex((p) => p.id === postId && p.author_id === authorId);
    if (idx === -1) return false;

    this.data.posts.splice(idx, 1);
    this.data.postLikes = this.data.postLikes.filter((l) => l.post_id !== postId);
    this.data.postComments = this.data.postComments.filter((c) => c.post_id !== postId);

    this.saveToDisk();
    this.syncToMockDb();
    return true;
  }

  // --- LIKES ---

  async toggleLike(postId: string, profileId: string, likerName?: string): Promise<{ liked: boolean; likesCount: number }> {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const likeIdx = this.data.postLikes.findIndex((l) => l.post_id === postId && l.profile_id === profileId);
    let liked = false;

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

      // Send notification to author if not self-like
      if (post.author_id !== profileId) {
        await this.createNotification({
          profile_id: post.author_id,
          type: "post_like",
          title: "New Like on your post! ❤️",
          message: `${likerName || "Someone"} liked your post.`,
          link: "/app",
        });
      }
    }

    this.saveToDisk();
    this.syncToMockDb();
    return { liked, likesCount: post.likes_count };
  }

  hasUserLiked(postId: string, profileId: string): boolean {
    return this.data.postLikes.some((l) => l.post_id === postId && l.profile_id === profileId);
  }

  getUserPosts(profileId: string): Post[] {
    return this.data.posts.filter((p) => p.author_id === profileId);
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
    this.saveToDisk();
    this.syncToMockDb();
  }

  // --- COMMENTS ---

  getPostComments(postId: string): { id: string; authorName: string; authorAvatar?: string; comment: string; createdAt: string }[] {
    const comments = this.data.postComments.filter((c) => c.post_id === postId);
    return comments.map((c) => {
      const author = mockDb.getProfile(c.profile_id) || CURATED_PROFILES[c.profile_id];
      return {
        id: c.id,
        authorName: author?.display_name || "VIBE Member",
        authorAvatar: author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.profile_id)}`,
        comment: c.comment,
        createdAt: c.created_at,
      };
    });
  }

  async addComment(
    postId: string,
    profileId: string,
    commentText: string,
    commenterName?: string
  ): Promise<{ success: boolean; comment: PostComment; commentsCount: number }> {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const comment: PostComment = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      post_id: postId,
      profile_id: profileId,
      comment: commentText,
      created_at: new Date().toISOString(),
    };

    this.data.postComments.push(comment);
    post.comments_count += 1;

    // Send notification to post author if not self-comment
    if (post.author_id !== profileId) {
      await this.createNotification({
        profile_id: post.author_id,
        type: "post_comment",
        title: "New Comment on your post 💬",
        message: `${commenterName || "Someone"} commented: "${commentText.slice(0, 60)}${commentText.length > 60 ? "..." : ""}"`,
        link: "/app",
      });
    }

    this.saveToDisk();
    this.syncToMockDb();
    return { success: true, comment, commentsCount: post.comments_count };
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

    const req: ConnectionRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

      // Award +25 XP to both attendees for forging a connection!
      await this.addXp(req.sender_id, 25, "Connected with a new attendee! +25 XP");
      await this.addXp(req.receiver_id, 25, "Connected with a new attendee! +25 XP");

      // Notify the original sender that their request was accepted!
      await this.createNotification({
        profile_id: req.sender_id,
        type: "connection_accepted",
        title: "Connection Accepted! 🎉",
        message: `${responderName || "User"} accepted your connection request!`,
        link: `/app/profile?id=${req.receiver_id}`,
      });

      // Update connections_count in Supabase if live
      if (isUsingLiveSupabase() && supabaseAdmin) {
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
    const raw = this.getConnectionRequests(profileId);

    const incoming: { request: ConnectionRequest; sender?: Profile }[] = [];
    for (const item of raw.incoming) {
      let sender = item.sender;
      if (!sender) {
        sender = (await getProfileByIdOrClerkId(item.request.sender_id)) || undefined;
      }
      incoming.push({ request: item.request, sender });
    }

    const outgoing: { request: ConnectionRequest; receiver?: Profile }[] = [];
    for (const item of raw.outgoing) {
      let receiver = item.receiver;
      if (!receiver) {
        receiver = (await getProfileByIdOrClerkId(item.request.receiver_id)) || undefined;
      }
      outgoing.push({ request: item.request, receiver });
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
    const connectedIds = this.data.connections
      .filter((c) => c.user_id_1 === profileId || c.user_id_2 === profileId)
      .map((c) => (c.user_id_1 === profileId ? c.user_id_2 : c.user_id_1));

    const result: Profile[] = [];
    for (const id of connectedIds) {
      const prof = mockDb.getProfile(id) || (CURATED_PROFILES[id] as Profile) || (await getProfileByIdOrClerkId(id));
      if (prof) result.push(prof);
    }
    return result;
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
    if (isUsingLiveSupabase() && supabaseAdmin) {
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
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaNotifs, error } = await supabaseAdmin
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
            message: n.body || "",
            type: n.type,
            read: Boolean(n.read_at),
            link: n.type === "connection_request" ? "/app/friends" : "/app",
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

    if (isUsingLiveSupabase() && supabaseAdmin) {
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
    if (isUsingLiveSupabase() && supabaseAdmin) {
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
    };
    this.saveToDisk();
    this.syncToMockDb();
  }
}

export const socialStore = new PersistentSocialStore();
