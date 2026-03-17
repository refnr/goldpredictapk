import { users, type User, type UpsertUser, type UserResponse } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateNickname(id: string, nickname: string): Promise<User | undefined>;
  getUserResponse(user: User): UserResponse;
  updateUserSubscription(id: string, data: {
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Date | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }): Promise<void>;
  updateUserByPlayToken(playToken: string, data: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateNickname(id: string, nickname: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ nickname, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserSubscription(id: string, data: {
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Date | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }): Promise<void> {
    await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserByPlayToken(playToken: string, data: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }): Promise<void> {
    await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.stripeSubscriptionId, playToken));
  }

  getUserResponse(user: User): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authStorage = new AuthStorage();
