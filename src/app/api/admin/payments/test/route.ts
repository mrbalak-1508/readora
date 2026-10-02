import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator authorization required" }, { status: 403 });
    }

    const body = await request.json();
    const { provider = "razorpay", publicKey, secretKey } = body;

    // Fetch existing database configuration if fields are missing or masked
    const existingConfig = await prisma.paymentProviderConfig.findUnique({
      where: { provider },
    });

    let effectivePublicKey = publicKey;
    if (!effectivePublicKey || effectivePublicKey.trim() === "") {
      effectivePublicKey =
        existingConfig?.publicKey ||
        (provider === "razorpay" ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID : "");
    }

    let effectiveSecretKey = secretKey;
    if (!effectiveSecretKey || effectiveSecretKey.includes("••••") || effectiveSecretKey.trim() === "") {
      effectiveSecretKey =
        existingConfig?.secretKeyEncrypted ||
        (provider === "razorpay" ? process.env.RAZORPAY_KEY_SECRET : "");
    }

    // 1. Razorpay Testing
    if (provider === "razorpay") {
      const isPlaceholder =
        !effectivePublicKey ||
        effectivePublicKey.includes("live_sim") ||
        effectivePublicKey.includes("test_readora") ||
        !effectivePublicKey.startsWith("rzp_");

      if (isPlaceholder) {
        return NextResponse.json({
          success: false,
          isPlaceholder: true,
          message:
            "Razorpay is currently configured with placeholder mock keys (rzp_test_readora_live_sim). Please enter your valid Razorpay Key ID and Secret from https://dashboard.razorpay.com to test live connection.",
        });
      }

      if (!effectiveSecretKey || effectiveSecretKey.includes("mock")) {
        return NextResponse.json({
          success: false,
          message: "Razorpay Secret Key is required to verify backend connection with Razorpay API.",
        });
      }

      // Test Razorpay API by generating a ₹1 test order (100 paise)
      const auth = Buffer.from(`${effectivePublicKey}:${effectiveSecretKey}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: 100, // ₹1.00
          currency: "INR",
          receipt: `test_${Date.now().toString().slice(-6)}`,
          notes: {
            source: "READORA_ADMIN_DIAGNOSTICS",
            adminUser: admin.email,
          },
        }),
      });

      const rzpData = await rzpRes.json();

      if (!rzpRes.ok) {
        const errorMsg =
          rzpData.error?.description ||
          rzpData.error?.code ||
          "Authentication failed. Please verify Key ID and Key Secret.";
        return NextResponse.json({
          success: false,
          error: errorMsg,
          details: rzpData.error,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Razorpay API! Test order created.",
        testOrder: {
          orderId: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency,
          keyId: effectivePublicKey,
          status: rzpData.status,
        },
      });
    }

    // 2. Stripe Testing
    if (provider === "stripe") {
      if (!effectiveSecretKey || effectiveSecretKey.includes("mock") || !effectiveSecretKey.startsWith("sk_")) {
        return NextResponse.json({
          success: false,
          isPlaceholder: true,
          message: "Stripe Secret Key is missing or invalid. Format should start with 'sk_test_' or 'sk_live_'.",
        });
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${effectiveSecretKey}`,
        },
      });

      const stripeData = await stripeRes.json();
      if (!stripeRes.ok) {
        return NextResponse.json({
          success: false,
          error: stripeData.error?.message || "Stripe authentication failed.",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Stripe API! Account balance retrieved.",
        details: { object: stripeData.object, livemode: stripeData.livemode },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${provider} configuration saved. Diagnostics available for Razorpay and Stripe.`,
    });
  } catch (err: any) {
    console.error("Payment test error:", err);
    return NextResponse.json({ error: err.message || "Diagnostic test failed" }, { status: 500 });
  }
}
