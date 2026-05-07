import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testSetId = searchParams.get("testSetId")

  if (!testSetId) {
    return NextResponse.redirect(new URL("/subjects", request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?redirect=/tests/${testSetId}`, request.url)
    )
  }

  const { data: testSet } = await supabase
    .from("test_sets")
    .select("*, subject:subject_id(name)")
    .eq("id", testSetId)
    .single()

  if (!testSet) {
    return NextResponse.redirect(new URL("/subjects", request.url))
  }

  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("test_set_id", testSetId)
    .maybeSingle()

  if (existingPurchase) {
    return NextResponse.redirect(new URL(`/tests/${testSetId}/take`, request.url))
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: testSet.name,
            description: testSet.subject?.name || "",
          },
          unit_amount: testSet.price_cents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tests/${testSetId}/take`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tests/${testSetId}`,
    metadata: {
      userId: user.id,
      testSetId: String(testSetId),
    },
  })

  if (!session.url) {
    return NextResponse.redirect(new URL(`/tests/${testSetId}`, request.url))
  }

  return NextResponse.redirect(session.url)
}
