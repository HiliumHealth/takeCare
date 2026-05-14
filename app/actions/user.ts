"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";

/**
 * Update the current user's profile.
 */
export async function updateMyProfile(data: {
  name?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const res = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...data },
  });
  revalidatePath("/dashboard");
  return res;
}

/**
 * Delete the current user's account and all data.
 */
export async function deleteMyAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.delete({
    where: { id: session.user.id }
  });

  // Clear the personalized cookie
  const cookieStore = await cookies();
  cookieStore.delete("takecare-personalized");

  revalidatePath("/");
  return { success: true };
}

/**
 * Logout — clear personalized cookie.
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("takecare-personalized");
}

/**
 * Ensure user exists in DB (Legacy/Sync).
 */
export async function ensureUser(clerkId: string, email: string, name?: string) {
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        clerkId, 
        name: name || user.name 
      },
    });
  } else {
    user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (user) {
       user = await prisma.user.update({
         where: { id: user.id },
         data: { email, name: name || user.name }
       });
    } else {
       user = await prisma.user.create({
         data: { clerkId, email, name },
       });
    }
  }

  return user;
}

export async function restoreSessionByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { personalization: true }
  });

  if (user) {
    const cookieStore = await cookies();
    if (user.personalization) {
      cookieStore.set("takecare-personalized", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    return { success: true, clerkId: user.clerkId };
  }

  return { success: false };
}
