"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";

// Build ID: TC-MED-V2

// ============================================================
// SECURE SERVER ACTIONS — all use auth() to identify the user
// No client-provided IDs are trusted for identity
// ============================================================

/**
 * Get the current authenticated user's medical history.
 * Uses NextAuth session — no client-side ID needed.
 */
export async function getMyMedicalHistory() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      medicalRecords: {
        orderBy: { createdAt: "desc" },
        include: { analysis: true }
      },
      doctorInvitations: {
        orderBy: { createdAt: "desc" }
      },
      prescriptions: {
        orderBy: { createdAt: "desc" },
        include: { medications: true }
      },
      personalization: true
    }
  });

  return user;
}

/**
 * Get a doctor invitation by its ID, including the linked user (patient).
 */
export async function getDoctorInvitation(inviteId: string) {
  const invitation = await prisma.doctorInvitation.findUnique({
    where: { id: inviteId },
    include: {
      user: {
        include: {
          personalization: true,
          medicalRecords: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { analysis: true }
          }
        }
      }
    }
  });

  return invitation;
}

/**
 * Check if the current user has completed personalization.
 */
export async function checkMyPersonalization() {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { personalization: true }
  });

  return !!user?.personalization;
}

/**
 * Save personalization data for the current user.
 * Also sets the `takecare-personalized` cookie securely (httpOnly).
 */
export async function saveMyPersonalization(data: {
  healthGoals?: string[];
  bloodType?: string;
  allergies?: string[];
  emergencyPhone?: string;
  theme?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const result = await prisma.personalization.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: {
      ...data,
    },
  });

  // Set the personalized cookie (httpOnly, secure)
  const cookieStore = await cookies();
  cookieStore.set("takecare-personalized", "true", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return result;
}



/**
 * Create a medical record for the current user.
 */
export async function createMyMedicalRecord(data: {
  type: string;
  url: string;
  fileName: string;
  description?: string;
  extractedText?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const record = await prisma.medicalRecord.create({
    data: {
      userId: session.user.id,
      ...data
    }
  });

  revalidatePath("/dashboard");
  return record;
}

/**
 * Add analysis to a medical record.
 */
export async function addAnalysis(recordId: string, analysisData: {
  summary: string;
  severity?: string;
  recommendations?: string[];
  rawJson?: any;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify the record belongs to this user
  const record = await prisma.medicalRecord.findFirst({
    where: { id: recordId, userId: session.user.id }
  });
  if (!record) throw new Error("Record not found or unauthorized");

  return await prisma.analysis.create({
    data: {
      medicalRecordId: recordId,
      ...analysisData
    }
  });
}


/**
 * Set the personalized cookie after sign-in (called once after auth).
 * Checks if the current user has personalization data and sets cookie accordingly.
 */
export async function syncPersonalizationCookie() {
  const session = await auth();
  if (!session?.user?.id) return { personalized: false };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { personalization: true }
  });

  const isPersonalized = !!user?.personalization;
  const cookieStore = await cookies();

  if (isPersonalized) {
    cookieStore.set("takecare-personalized", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
  } else {
    cookieStore.delete("takecare-personalized");
  }

  return { personalized: isPersonalized };
}

// ============================================================
// LEGACY ACTIONS — kept for backward compatibility with
// components that haven't been migrated yet (e.g., doctor pages)
// ============================================================

export async function getMedicalHistory(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      medicalRecords: {
        orderBy: { createdAt: "desc" },
        include: { analysis: true }
      },
      doctorInvitations: {
        orderBy: { createdAt: "desc" }
      },
      personalization: true
    }
  });

  return user;
}

export async function hasPersonalized(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { personalization: true }
  });
  return !!user?.personalization;
}

export async function savePersonalization(clerkId: string, data: {
  healthGoals?: string[];
  bloodType?: string;
  allergies?: string[];
  emergencyPhone?: string;
  theme?: string;
}) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  const result = await prisma.personalization.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: {
      ...data,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("takecare-personalized", "true", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  return result;
}

export async function updateProfile(clerkId: string, data: {
  name?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
}) {
  const res = await prisma.user.update({
    where: { clerkId },
    data: { ...data },
  });
  revalidatePath("/dashboard");
  return res;
}

export async function deleteUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  await prisma.user.delete({
    where: { id: user.id }
  });

  revalidatePath("/");
  return { success: true };
}


export async function createMedicalRecord(clerkId: string, data: {
  type: string;
  url: string;
  fileName: string;
  description?: string;
  extractedText?: string;
}) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  const record = await prisma.medicalRecord.create({
    data: {
      userId: user.id,
      ...data
    }
  });

  revalidatePath("/dashboard");
  return record;
}

export async function deleteMedicalRecord(recordId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Ensure the record belongs to the user
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId }
  });

  if (!record || record.userId !== session.user.id) {
    throw new Error("Record not found or unauthorized");
  }

  await prisma.medicalRecord.delete({
    where: { id: recordId }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDoctorInvitation(inviteId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Ensure the invitation belongs to the user
  const invitation = await prisma.doctorInvitation.findUnique({
    where: { id: inviteId }
  });

  if (!invitation || invitation.userId !== session.user.id) {
    throw new Error("Invitation not found or unauthorized");
  }

  await prisma.doctorInvitation.delete({
    where: { id: inviteId }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

