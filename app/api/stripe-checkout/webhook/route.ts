import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId"
import { createEnrollment } from "@/sanity/lib/student/createEnrollment"

// Disable body parsing, need raw body for Stripe webhook signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion
})

// For local development with Stripe CLI, use the webhook secret from CLI output
// For production, use the webhook secret from Stripe dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_KEY || process.env.STRIPE_WEBHOOK_SECRET_LOCAL

export async function POST(req: Request) {
  try {
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_LOCAL is not set")
      return new NextResponse("Webhook secret not configured", { status: 500 })
    }

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    console.log("Webhook received:", {
      hasSignature: !!signature,
      bodyLength: body.length,
      webhookSecretSet: !!webhookSecret
    })

    if (!signature) {
      console.error("No stripe-signature header found")
      return new NextResponse("No signature found", { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("Webhook event verified:", event.type)
    } catch (error: unknown) {
      const errorMessage = 
        error instanceof Error ? error.message : "Unknown error"
      console.error(`Webhook signature verification failed: ${errorMessage}`)
      console.error("Make sure you're using the webhook secret from 'stripe listen' output")

      return new NextResponse(`Webhook Error: ${errorMessage}`, {
        status: 400
      })
    }

    // Only process checkout.session.completed events
    if (event.type === "checkout.session.completed") {
      try {
        const session = event.data.object as Stripe.Checkout.Session

        console.log("Checkout session completed:", {
          sessionId: session.id,
          metadata: session.metadata
        })

        const courseId = session.metadata?.courseId
        const userId = session.metadata?.userId

        if (!courseId || !userId) {
          console.error("Missing metadata in session:", { courseId, userId })
          return new NextResponse("Missing metadata", {
            status: 400
          })
        }

        const student = await getStudentByClerkId(userId)

        if (!student.data) {
          console.error(`Student not found for userId: ${userId}`)
          return new NextResponse("Student not found", { status: 400 })
        }

        console.log(`Creating enrollment for student ${student.data._id} and course ${courseId}`)

        const enrollment = await createEnrollment({
          studentId: student.data._id,
          courseId,
          paymentId: session.id,
          amount: session.amount_total! / 100
        })

        console.log(`Enrollment created successfully: ${enrollment._id}`)
        return new NextResponse(null, { status: 200 })
      } catch (error) {
        console.error("Error processing checkout.session.completed:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("Error details:", errorMessage)
        // Return 200 to prevent Stripe from retrying, but log the error
        return new NextResponse(`Error: ${errorMessage}`, { status: 200 })
      }
    }

    // For other event types, just acknowledge receipt
    console.log(`Received unhandled event type: ${event.type}`)
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error(`Error in webhook handler:`, error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error stack:", errorStack)
    return new NextResponse(`Webhook handler failed: ${errorMessage}`, { status: 500 })
  }
}