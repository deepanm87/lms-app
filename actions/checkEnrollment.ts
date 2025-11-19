"use server"

import { isEnrolledInCourse } from "@/sanity/lib/student/isEnrolledInCourse"
import { auth } from "@clerk/nextjs/server"

export async function checkEnrollment(courseId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return false
    }
    return await isEnrolledInCourse(userId, courseId)
  } catch (error) {
    console.error("Error checking enrollment:", error)
    return false
  }
}

