// In-Memory Database Store for VIBE 2026 Social Networking & Games Platform

import {
  Profile,
  ConnectionRequest,
  Connection,
  Post,
  PostLike,
  PostComment,
  SocialChallenge,
  ChallengeCompletion,
  GameSession,
  GameType,
  Notification,
  AdminXpAdjustment,
  LeaderboardEntry,
  GameLeaderboardEntry,
  VIBE_LEVELS,
} from "@/types/database";

export function calculateLevel(xp: number) {
  if (xp >= 2500) return { level_number: 6, level_name: "VIBE LEGEND", badge: "👑", min_xp: 2500, max_xp: null };
  if (xp >= 1500) return { level_number: 5, level_name: "VIBE ICON", badge: "💫", min_xp: 1500, max_xp: 2499 };
  if (xp >= 1000) return { level_number: 4, level_name: "VIBE RIDER", badge: "⚡", min_xp: 1000, max_xp: 1499 };
  if (xp >= 500) return { level_number: 3, level_name: "VIBE SEEKER", badge: "🔥", min_xp: 500, max_xp: 999 };
  if (xp >= 250) return { level_number: 2, level_name: "VIBE EXPLORER", badge: "✨", min_xp: 250, max_xp: 499 };
  return { level_number: 1, level_name: "VIBE NEWBIE", badge: "🌱", min_xp: 0, max_xp: 249 };
}

class VibeMemoryDatabase {
  profiles: Map<string, Profile> = new Map();
  clerkToProfileMap: Map<string, string> = new Map();
  connectionRequests: ConnectionRequest[] = [];
  connections: Connection[] = [];
  posts: Post[] = [];
  postLikes: PostLike[] = [];
  postComments: PostComment[] = [];
  challenges: SocialChallenge[] = [];
  challengeCompletions: ChallengeCompletion[] = [];
  gameSessions: GameSession[] = [];
  notifications: Notification[] = [];
  adminXpAdjustments: AdminXpAdjustment[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // System Social Challenges Templates
    this.challenges = [
      {
        id: "ch-1",
        title: "INTRODUCE YOURSELF",
        description: "Create a post containing your name, college and one interesting fact.",
        reward_xp: 100,
        challenge_type: "introduce_yourself",
        is_active: true,
      },
      {
        id: "ch-2",
        title: "FIND SOMEONE NEW",
        description: "Connect with someone you did not previously know.",
        reward_xp: 50,
        challenge_type: "find_someone_new",
        is_active: true,
      },
      {
        id: "ch-3",
        title: "VIBE INTRO",
        description: "Upload a photo and share three things about yourself.",
        reward_xp: 100,
        challenge_type: "vibe_intro",
        is_active: true,
      },
    ];

    // ZERO mock profiles, posts, comments, likes, or fake notifications
    this.profiles.clear();
    this.clerkToProfileMap.clear();
    this.connectionRequests = [];
    this.connections = [];
    this.posts = [];
    this.postLikes = [];
    this.postComments = [];
    this.challengeCompletions = [];
    this.gameSessions = [];
    this.notifications = [];
    this.adminXpAdjustments = [];
  }

  // --- PROFILE METHODS ---

  getProfile(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  getProfileByClerkId(clerkId: string): Profile | undefined {
    const id = this.clerkToProfileMap.get(clerkId);
    if (id) return this.profiles.get(id);

    // Fallback search
    for (const p of Array.from(this.profiles.values())) {
      if (p.clerk_user_id === clerkId) return p;
    }
    return undefined;
  }

  getProfileByUsername(username: string): Profile | undefined {
    const clean = username.trim().toLowerCase();
    for (const p of Array.from(this.profiles.values())) {
      if (p.username && p.username.toLowerCase() === clean) return p;
    }
    return undefined;
  }

  isUsernameTaken(username: string, excludeProfileId?: string): boolean {
    const clean = username.trim().toLowerCase();
    for (const p of Array.from(this.profiles.values())) {
      if (p.username && p.username.toLowerCase() === clean && p.id !== excludeProfileId) {
        return true;
      }
    }
    return false;
  }

  createProfile(data: {
    clerk_user_id: string;
    display_name: string;
    email: string;
    phone: string;
    rotaract_club: string;
    college: string;
    course_year: string;
    instagram_username?: string | null;
    bio?: string | null;
    interests: string[];
    skills?: string[];
    hobbies?: string[];
    favorite_music?: string[];
    favorite_movies?: string[];
    city?: string | null;
    avatar_url?: string | null;
  }): Profile {
    const existing = this.getProfileByClerkId(data.clerk_user_id);
    if (existing) return existing;

    const profileId = `prof-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const username = (data.display_name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(10 + Math.random() * 90)).slice(0, 20);
    const vibeId = `VB2026-${Math.floor(100 + Math.random() * 900)}`;

    // Initial XP Rewards: Profile complete (+50 XP), Instagram added (+25 XP)
    let initialXp = 50;
    if (data.instagram_username && data.instagram_username.trim().length > 0) {
      initialXp += 25;
    }

    const lvl = calculateLevel(initialXp);

    const profile: Profile = {
      id: profileId,
      clerk_user_id: data.clerk_user_id,
      vibe_id: vibeId,
      display_name: data.display_name,
      username,
      avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.display_name)}`,
      email: data.email,
      phone: data.phone,
      rotaract_club: data.rotaract_club,
      college: data.college,
      course_year: data.course_year,
      instagram_username: data.instagram_username || null,
      bio: data.bio || null,
      interests: data.interests || [],
      skills: data.skills || [],
      hobbies: data.hobbies || [],
      favorite_music: data.favorite_music || [],
      favorite_movies: data.favorite_movies || [],
      city: data.city || null,
      is_discoverable: true,
      xp: initialXp,
      level_number: lvl.level_number,
      level_name: lvl.level_name,
      connections_count: 0,
      posts_count: 0,
      games_played_count: 0,
      registration_id: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
      profile_completed: Boolean(data.bio && data.interests && data.interests.length > 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.set(profileId, profile);
    this.clerkToProfileMap.set(data.clerk_user_id, profileId);

    // Welcome Notification for newly created user
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      profile_id: profileId,
      title: "Welcome to VIBE 2026! 🚀",
      message: `Profile registered! You earned +${initialXp} XP to kick off your journey!`,
      type: "xp_earned",
      read: false,
      link: "/app/profile",
      created_at: new Date().toISOString(),
    });

    return profile;
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile | undefined {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;

    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (updates.xp !== undefined) {
      const lvl = calculateLevel(updated.xp);
      if (lvl.level_number > updated.level_number) {
        this.notifications.unshift({
          id: `notif-${Date.now()}`,
          profile_id: id,
          title: "LEVEL UP! 🎉",
          message: `You achieved Level ${lvl.level_number}: ${lvl.level_name}!`,
          type: "level_unlocked",
          read: false,
          link: "/app/profile",
          created_at: new Date().toISOString(),
        });
      }
      updated.level_number = lvl.level_number;
      updated.level_name = lvl.level_name;
    }

    this.profiles.set(id, updated);
    return updated;
  }

  addXpToProfile(id: string, amount: number, reason: string): Profile | undefined {
    const profile = this.profiles.get(id);
    if (!profile || amount <= 0) return profile;

    const newXp = profile.xp + amount;
    const updated = this.updateProfile(id, { xp: newXp });

    this.notifications.unshift({
      id: `notif-xp-${Date.now()}`,
      profile_id: id,
      title: `+${amount} XP Earned! ⭐`,
      message: reason,
      type: "xp_earned",
      read: false,
      link: "/app/profile",
      created_at: new Date().toISOString(),
    });

    return updated;
  }

  searchProfiles(
    query?: string,
    college?: string,
    club?: string,
    interest?: string,
    currentUserId?: string
  ): Profile[] {
    let list = Array.from(this.profiles.values()).filter((p) => p.is_discoverable);

    if (currentUserId) {
      list = list.filter((p) => p.id !== currentUserId);
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.rotaract_club.toLowerCase().includes(q)
      );
    }

    if (college && college !== "all") {
      list = list.filter((p) => p.college === college);
    }

    if (club && club !== "all") {
      list = list.filter((p) => p.rotaract_club === club);
    }

    if (interest && interest !== "all") {
      list = list.filter((p) => p.interests.includes(interest));
    }

    return list;
  }

  // --- NETWORKING METHODS ---

  sendConnectionRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) return { success: false, message: "Cannot connect with yourself" };

    const existingReq = this.connectionRequests.find(
      (r) =>
        (r.sender_id === senderId && r.receiver_id === receiverId) ||
        (r.sender_id === receiverId && r.receiver_id === senderId)
    );

    if (existingReq) {
      return { success: false, message: "Connection request already pending or processed" };
    }

    const isAlreadyConnected = this.connections.some(
      (c) =>
        (c.user_id_1 === senderId && c.user_id_2 === receiverId) ||
        (c.user_id_1 === receiverId && c.user_id_2 === senderId)
    );

    if (isAlreadyConnected) {
      return { success: false, message: "Already connected" };
    }

    const req: ConnectionRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.connectionRequests.unshift(req);

    const sender = this.getProfile(senderId);
    this.notifications.unshift({
      id: `notif-req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      profile_id: receiverId,
      title: "New Connection Request! 👋",
      message: `${sender?.display_name || "Someone"} wants to connect with you.`,
      type: "connection_request",
      read: false,
      link: "/app/discover",
      created_at: new Date().toISOString(),
    });

    return { success: true, request: req };
  }

  acceptConnectionRequest(requestId: string, currentUserId: string) {
    const req = this.connectionRequests.find((r) => r.id === requestId);
    if (!req || req.receiver_id !== currentUserId || req.status !== "pending") {
      return { success: false, message: "Invalid or expired connection request" };
    }

    req.status = "accepted";
    req.updated_at = new Date().toISOString();

    const conn: Connection = {
      id: `conn-${Date.now()}`,
      user_id_1: req.sender_id,
      user_id_2: req.receiver_id,
      connected_at: new Date().toISOString(),
    };
    this.connections.push(conn);

    const sender = this.getProfile(req.sender_id);
    const receiver = this.getProfile(req.receiver_id);

    if (sender) {
      sender.connections_count += 1;
      this.evaluateConnectionMilestones(sender);
    }
    if (receiver) {
      receiver.connections_count += 1;
      this.evaluateConnectionMilestones(receiver);
    }

    this.notifications.unshift({
      id: `notif-acc-${Date.now()}`,
      profile_id: req.sender_id,
      title: "Connection Accepted! 🎉",
      message: `${receiver?.display_name || "User"} accepted your request!`,
      type: "connection_accepted",
      read: false,
      link: `/app/profile?id=${req.receiver_id}`,
      created_at: new Date().toISOString(),
    });

    return { success: true, connection: conn };
  }

  declineConnectionRequest(requestId: string, currentUserId: string) {
    const req = this.connectionRequests.find((r) => r.id === requestId);
    if (!req || req.receiver_id !== currentUserId) {
      return { success: false, message: "Invalid connection request" };
    }
    req.status = "declined";
    req.updated_at = new Date().toISOString();
    return { success: true };
  }

  private evaluateConnectionMilestones(profile: Profile) {
    const count = profile.connections_count;
    let milestoneXp = 0;
    let milestoneMsg = "";

    if (count === 1) {
      milestoneXp = 25;
      milestoneMsg = "First connection milestone achieved! +25 XP";
    } else if (count === 5) {
      milestoneXp = 50;
      milestoneMsg = "5 connections milestone achieved! +50 XP";
    } else if (count === 10) {
      milestoneXp = 100;
      milestoneMsg = "10 connections milestone achieved! +100 XP";
    } else if (count === 25) {
      milestoneXp = 150;
      milestoneMsg = "25 connections milestone achieved! +150 XP";
    } else if (count === 50) {
      milestoneXp = 250;
      milestoneMsg = "50 connections milestone achieved! +250 XP";
    }

    if (milestoneXp > 0) {
      this.addXpToProfile(profile.id, milestoneXp, milestoneMsg);
    }
  }

  getConnections(profileId: string): Profile[] {
    const connectedIds = this.connections
      .filter((c) => c.user_id_1 === profileId || c.user_id_2 === profileId)
      .map((c) => (c.user_id_1 === profileId ? c.user_id_2 : c.user_id_1));

    return connectedIds
      .map((id) => this.getProfile(id))
      .filter((p): p is Profile => p !== undefined);
  }

  getConnectionRequests(profileId: string) {
    const incoming = this.connectionRequests
      .filter((r) => r.receiver_id === profileId && r.status === "pending")
      .map((r) => ({
        request: r,
        sender: this.getProfile(r.sender_id),
      }));

    const outgoing = this.connectionRequests
      .filter((r) => r.sender_id === profileId && r.status === "pending")
      .map((r) => ({
        request: r,
        receiver: this.getProfile(r.receiver_id),
      }));

    return { incoming, outgoing };
  }

  getMutualConnectionsCount(userAId: string, userBId: string): number {
    const connsA = new Set(
      this.connections
        .filter((c) => c.user_id_1 === userAId || c.user_id_2 === userAId)
        .map((c) => (c.user_id_1 === userAId ? c.user_id_2 : c.user_id_1))
    );

    const connsB = this.connections
      .filter((c) => c.user_id_1 === userBId || c.user_id_2 === userBId)
      .map((c) => (c.user_id_1 === userBId ? c.user_id_2 : c.user_id_1));

    let count = 0;
    connsB.forEach((id) => {
      if (connsA.has(id)) count++;
    });

    return count;
  }

  getConnectionStatus(senderId: string, receiverId: string): "connected" | "pending_sent" | "pending_received" | "none" {
    if (senderId === receiverId) return "none";

    const isConn = this.connections.some(
      (c) =>
        (c.user_id_1 === senderId && c.user_id_2 === receiverId) ||
        (c.user_id_1 === receiverId && c.user_id_2 === senderId)
    );
    if (isConn) return "connected";

    const req = this.connectionRequests.find(
      (r) =>
        r.status === "pending" &&
        ((r.sender_id === senderId && r.receiver_id === receiverId) ||
          (r.sender_id === receiverId && r.receiver_id === senderId))
    );

    if (!req) return "none";
    return req.sender_id === senderId ? "pending_sent" : "pending_received";
  }

  // --- SOCIAL FEED METHODS ---

  getPosts(): (Post & { author: Profile })[] {
    return this.posts.map((p) => {
      const author = this.getProfile(p.author_id) || {
        id: p.author_id,
        clerk_user_id: "",
        vibe_id: "VB-GUEST",
        display_name: "VIBE Member",
        username: "vibe_user",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=vibe",
        email: "",
        phone: "",
        rotaract_club: "Rotaract Club",
        college: "College",
        course_year: "Student",
        instagram_username: null,
        bio: null,
        interests: [],
        is_discoverable: true,
        xp: 0,
        level_number: 1,
        level_name: "VIBE NEWBIE",
        connections_count: 0,
        posts_count: 0,
        games_played_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return {
        ...p,
        author,
      };
    });
  }

  createPost(authorId: string, caption: string, imageUrl?: string | null): { post: Post; xpEarned: number } {
    const post: Post = {
      id: `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      author_id: authorId,
      caption,
      image_url: imageUrl || null,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.posts.unshift(post);

    let xpEarned = 0;
    const author = this.getProfile(authorId);
    if (author) {
      author.posts_count += 1;

      // First Post XP (+50 XP) - Awarded ONLY ONCE per user
      if (author.posts_count === 1) {
        xpEarned = 50;
        this.addXpToProfile(authorId, 50, "First VIBE Post published! +50 XP");
      }
    }

    return { post, xpEarned };
  }

  hasUserLikedPost(postId: string, profileId: string): boolean {
    return this.postLikes.some((l) => l.post_id === postId && l.profile_id === profileId);
  }

  likePost(postId: string, profileId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { success: false, message: "Post not found" };

    const existingLikeIndex = this.postLikes.findIndex(
      (l) => l.post_id === postId && l.profile_id === profileId
    );

    if (existingLikeIndex !== -1) {
      this.postLikes.splice(existingLikeIndex, 1);
      post.likes_count = Math.max(0, post.likes_count - 1);
      return { success: true, liked: false, likesCount: post.likes_count };
    } else {
      this.postLikes.push({
        id: `like-${Date.now()}`,
        post_id: postId,
        profile_id: profileId,
        created_at: new Date().toISOString(),
      });
      post.likes_count += 1;

      if (post.author_id !== profileId) {
        const liker = this.getProfile(profileId);
        this.notifications.unshift({
          id: `notif-like-${Date.now()}`,
          profile_id: post.author_id,
          title: "New Like on your post ❤️",
          message: `${liker?.display_name || "Someone"} liked your post.`,
          type: "post_like",
          read: false,
          link: "/app",
          created_at: new Date().toISOString(),
        });
      }

      return { success: true, liked: true, likesCount: post.likes_count };
    }
  }

  commentPost(postId: string, profileId: string, commentText: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { success: false, message: "Post not found" };

    const comment: PostComment = {
      id: `cmt-${Date.now()}`,
      post_id: postId,
      profile_id: profileId,
      comment: commentText,
      created_at: new Date().toISOString(),
    };

    this.postComments.push(comment);
    post.comments_count += 1;

    if (post.author_id !== profileId) {
      const commenter = this.getProfile(profileId);
      this.notifications.unshift({
        id: `notif-cmt-${Date.now()}`,
        profile_id: post.author_id,
        title: "New Comment on your post 💬",
        message: `${commenter?.display_name || "Someone"}: "${commentText.slice(0, 30)}..."`,
        type: "post_comment",
        read: false,
        link: "/app",
        created_at: new Date().toISOString(),
      });
    }

    return { success: true, comment, commentsCount: post.comments_count };
  }

  getPostComments(postId: string): (PostComment & { author: Profile })[] {
    return this.postComments
      .filter((c) => c.post_id === postId)
      .map((c) => ({
        ...c,
        author: this.getProfile(c.profile_id)!,
      }));
  }

  deletePost(postId: string, profileId: string): boolean {
    const index = this.posts.findIndex((p) => p.id === postId && p.author_id === profileId);
    if (index !== -1) {
      this.posts.splice(index, 1);
      const author = this.getProfile(profileId);
      if (author) author.posts_count = Math.max(0, author.posts_count - 1);
      return true;
    }
    return false;
  }

  // --- SOCIAL CHALLENGES ---

  getChallenges() {
    return this.challenges;
  }

  completeChallenge(profileId: string, challengeId: string) {
    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.is_active) {
      return { success: false, message: "Challenge unavailable" };
    }

    const alreadyDone = this.challengeCompletions.some(
      (cc) => cc.profile_id === profileId && cc.challenge_id === challengeId
    );

    if (alreadyDone) {
      return { success: false, message: "Challenge already completed!" };
    }

    const completion: ChallengeCompletion = {
      id: `cc-${Date.now()}`,
      profile_id: profileId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
      xp_earned: challenge.reward_xp,
    };

    this.challengeCompletions.push(completion);
    this.addXpToProfile(profileId, challenge.reward_xp, `Challenge Completed: ${challenge.title}!`);

    return { success: true, xpEarned: challenge.reward_xp };
  }

  getUserCompletedChallengeIds(profileId: string): string[] {
    return this.challengeCompletions
      .filter((cc) => cc.profile_id === profileId)
      .map((cc) => cc.challenge_id);
  }

  // --- GAMES & XP PERFORMANCE METHODS ---

  submitGameScore(profileId: string, gameType: GameType, score: number, maxScore: number, timeSeconds?: number) {
    let potentialXp = 25;

    if (gameType === "rotaract_game" || gameType === "vibe_quiz") {
      const pct = (score / maxScore) * 100;
      if (pct >= 81) potentialXp = 150;
      else if (pct >= 61) potentialXp = 100;
      else if (pct >= 31) potentialXp = 50;
      else potentialXp = 25;
    } else if (gameType === "minion_game") {
      if (score >= 1000) potentialXp = 100;
      else if (score >= 600) potentialXp = 75;
      else if (score >= 300) potentialXp = 50;
      else potentialXp = 25;
    } else if (gameType === "memory_game") {
      potentialXp = 50; // Base completion
      if (timeSeconds && timeSeconds <= 25) potentialXp = 100;
      else if (timeSeconds && timeSeconds <= 40) potentialXp = 75;
      else if (score >= 900) potentialXp = 100;
      else if (score >= 600) potentialXp = 75;
    }

    // Anti-Abuse XP Rule: Only award incremental XP if beating previous highest XP tier
    const previousSessions = this.gameSessions.filter(
      (gs) => gs.profile_id === profileId && gs.game_type === gameType
    );

    const prevMaxXp = previousSessions.reduce((max, gs) => Math.max(max, gs.xp_earned), 0);
    const prevBestScore = previousSessions.reduce((max, gs) => Math.max(max, gs.score), 0);

    const xpEarned = Math.max(0, potentialXp - prevMaxXp);
    const isPersonalBest = previousSessions.length === 0 || score > prevBestScore;

    const session: GameSession = {
      id: `gs-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      profile_id: profileId,
      game_type: gameType,
      score,
      max_score: maxScore,
      xp_earned: xpEarned,
      played_at: new Date().toISOString(),
    };

    this.gameSessions.push(session);

    const profile = this.getProfile(profileId);
    if (profile) {
      profile.games_played_count += 1;
      if (xpEarned > 0) {
        this.addXpToProfile(
          profileId,
          xpEarned,
          `Played ${gameType.replace("_", " ").toUpperCase()} (+${xpEarned} XP)`
        );
      }
    }

    return {
      success: true,
      xpEarned,
      potentialXp,
      isPersonalBest,
      prevBestScore: Math.max(prevBestScore, score),
      session,
    };
  }

  getGameSummary(profileId: string) {
    const summary = {
      rotaract_game: { bestScore: 0, maxScore: 10, totalXp: 0, attempts: 0, completed: false },
      minion_game: { bestScore: 0, maxScore: 1500, totalXp: 0, attempts: 0, completed: false },
      memory_game: { bestScore: 0, maxScore: 1000, bestTimeSeconds: 0, totalXp: 0, attempts: 0, completed: false },
      vibe_quiz: { bestScore: 0, maxScore: 10, totalXp: 0, attempts: 0, completed: false },
    };

    this.gameSessions
      .filter((gs) => gs.profile_id === profileId)
      .forEach((gs) => {
        const item = summary[gs.game_type as keyof typeof summary];
        if (item) {
          item.attempts += 1;
          item.completed = true;
          item.bestScore = Math.max(item.bestScore, gs.score);
          item.totalXp += gs.xp_earned;
        }
      });

    return summary;
  }

  getGameHighScores(profileId: string) {
    const scores: Record<GameType, number> = {
      rotaract_game: 0,
      minion_game: 0,
      memory_game: 0,
      vibe_quiz: 0,
    };

    this.gameSessions
      .filter((gs) => gs.profile_id === profileId)
      .forEach((gs) => {
        if (gs.score > (scores[gs.game_type] || 0)) {
          scores[gs.game_type] = gs.score;
        }
      });

    return scores;
  }

  // --- LEADERBOARDS ---

  getLeaderboard(): LeaderboardEntry[] {
    const profiles = Array.from(this.profiles.values());
    profiles.sort((a, b) => b.xp - a.xp);

    return profiles.map((p, idx) => ({
      rank: idx + 1,
      profile_id: p.id,
      display_name: p.display_name,
      username: p.username,
      avatar_url: p.avatar_url,
      college: p.college,
      rotaract_club: p.rotaract_club,
      total_xp: p.xp,
      level_name: p.level_name,
      level_number: p.level_number,
      connections_count: p.connections_count,
    }));
  }

  getGameLeaderboard(gameType: GameType): GameLeaderboardEntry[] {
    const bestScoresMap = new Map<string, { highScore: number; gamesPlayed: number; playedAt: string }>();

    this.gameSessions
      .filter((gs) => gs.game_type === gameType)
      .forEach((gs) => {
        const current = bestScoresMap.get(gs.profile_id) || { highScore: 0, gamesPlayed: 0, playedAt: gs.played_at };
        bestScoresMap.set(gs.profile_id, {
          highScore: Math.max(current.highScore, gs.score),
          gamesPlayed: current.gamesPlayed + 1,
          playedAt: gs.played_at,
        });
      });

    const entries: GameLeaderboardEntry[] = [];
    bestScoresMap.forEach((val, profileId) => {
      const p = this.getProfile(profileId);
      if (p) {
        entries.push({
          rank: 0,
          profile_id: p.id,
          display_name: p.display_name,
          username: p.username,
          avatar_url: p.avatar_url,
          high_score: val.highScore,
          games_played: val.gamesPlayed,
          played_at: val.playedAt,
        });
      }
    });

    entries.sort((a, b) => b.high_score - a.high_score);
    entries.forEach((e, idx) => (e.rank = idx + 1));

    return entries;
  }

  // --- NOTIFICATION METHODS ---

  getNotifications(profileId: string): Notification[] {
    return this.notifications.filter((n) => n.profile_id === profileId);
  }

  markNotificationsRead(profileId: string) {
    this.notifications
      .filter((n) => n.profile_id === profileId)
      .forEach((n) => (n.read = true));
  }

  // --- ADMIN DASHBOARD & XP ADJUSTMENT METHODS ---

  adminAdjustXp(
    targetProfileId: string,
    adminProfileId: string,
    adminName: string,
    amount: number,
    reason: string
  ) {
    const profile = this.getProfile(targetProfileId);
    if (!profile) return { success: false, message: "User profile not found" };

    const adjustment: AdminXpAdjustment = {
      id: `adj-${Date.now()}`,
      target_profile_id: targetProfileId,
      admin_profile_id: adminProfileId,
      admin_name: adminName,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.adminXpAdjustments.unshift(adjustment);

    const newXp = Math.max(0, profile.xp + amount);
    this.updateProfile(targetProfileId, { xp: newXp });

    this.notifications.unshift({
      id: `notif-admin-${Date.now()}`,
      profile_id: targetProfileId,
      title: "XP Balance Adjusted by Admin",
      message: `${amount >= 0 ? "+" : ""}${amount} XP applied by ${adminName}. Reason: ${reason}`,
      type: "xp_earned",
      read: false,
      link: "/app/profile",
      created_at: new Date().toISOString(),
    });

    return { success: true, adjustment, newXp };
  }

  getAdminStats() {
    const totalUsers = this.profiles.size;
    const activeUsers = Array.from(this.profiles.values()).filter((p) => p.posts_count > 0 || p.connections_count > 0 || p.games_played_count > 0).length;
    const profilesCompleted = Array.from(this.profiles.values()).filter((p) => p.bio && p.interests.length > 0).length;
    const totalConnections = this.connections.length;

    const totalPosts = this.posts.length;
    const photosUploaded = this.posts.filter((p) => Boolean(p.image_url)).length;
    const commentsCount = this.postComments.length;
    const likesCount = this.postLikes.length;

    const connectionReqsSent = this.connectionRequests.length;
    const connectionReqsAccepted = this.connectionRequests.filter((r) => r.status === "accepted").length;
    const avgConnections = totalUsers > 0 ? (totalConnections / totalUsers).toFixed(1) : "0";

    let maxConn = 0;
    let mostConnectedUser = "None";
    for (const p of Array.from(this.profiles.values())) {
      if (p.connections_count > maxConn) {
        maxConn = p.connections_count;
        mostConnectedUser = `${p.display_name} (${p.connections_count})`;
      }
    }

    const gamesPlayed = this.gameSessions.length;
    const xpFromGames = this.gameSessions.reduce((acc, curr) => acc + curr.xp_earned, 0);

    return {
      users: { totalUsers, activeUsers, profilesCompleted, totalConnections },
      social: { totalPosts, photosUploaded, commentsCount, likesCount, reportsCount: 0 },
      networking: { connectionReqsSent, connectionReqsAccepted, avgConnections, mostConnectedUser },
      games: { gamesPlayed, xpFromGames },
    };
  }

  getAdminXpAdjustments(): AdminXpAdjustment[] {
    return this.adminXpAdjustments;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __vibeMockDb: VibeMemoryDatabase | undefined;
}

export const mockDb =
  globalThis.__vibeMockDb || (globalThis.__vibeMockDb = new VibeMemoryDatabase());

