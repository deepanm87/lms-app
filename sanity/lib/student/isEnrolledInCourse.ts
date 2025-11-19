import groq from "groq"
import { sanityFetch } from "../live"

export async function isEnrolledInCourse(clerkId: string, courseId: string) {
  try {
    const studentQuery = groq`*[_type == "student" && clerkId == $clerkId][0]._id`
    const studentResult = await sanityFetch({
      query: studentQuery,
      params: { clerkId }
    })

    const studentId = studentResult.data

    if (!studentId) {
      console.log(`No student found with clerkId: ${clerkId}`)
      return false
    }

    const enrollmentQuery = groq`*[_type == "enrollment" && student._ref == $studentId && course._ref == $courseId][0]`
    const enrollmentResult = await sanityFetch({
      query: enrollmentQuery,
      params: { studentId, courseId }
    })

    return !!enrollmentResult.data
  } catch (error) {
    console.error(`Error checking enrollment status: ${error}`)
    return false
  }
}