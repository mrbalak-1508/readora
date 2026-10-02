import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator authorization required" }, { status: 403 });
    }

    const configs = await prisma.paymentProviderConfig.findMany();

    // Mask secret keys for frontend security (Requirement 20: Secrets must NEVER be exposed to the browser)
    const sanitized = configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      enabled: c.enabled,
      testMode: c.testMode,
      publicKey: c.publicKey || "",
      hasSecretKey: Boolean(c.secretKeyEncrypted),
      hasWebhookSecret: Boolean(c.webhookSecret),
      secretKeyMasked: c.secretKeyEncrypted ? "••••••••••••••••••••" : "",
      webhookSecretMasked: c.webhookSecret ? "••••••••••••••••••••" : "",
    }));

    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator authorization required" }, { status: 403 });
    }

    const body = await request.json();
    const { provider, enabled, testMode, publicKey, secretKey, webhookSecret } = body;

    const dataToUpdate: any = {
      enabled: Boolean(enabled),
      testMode: Boolean(testMode),
      publicKey: publicKey || undefined,
    };

    // Only update secrets if a new non-masked string is provided
    if (secretKey && !secretKey.includes("••••")) {
      dataToUpdate.secretKeyEncrypted = secretKey;
    }
    if (webhookSecret && !webhookSecret.includes("••••")) {
      dataToUpdate.webhookSecret = webhookSecret;
    }

    const updated = await prisma.paymentProviderConfig.upsert({
      where: { provider },
      update: dataToUpdate,
      create: {
        provider,
        enabled: Boolean(enabled),
        testMode: Boolean(testMode),
        publicKey: publicKey || "",
        secretKeyEncrypted: secretKey || "",
        webhookSecret: webhookSecret || "",
      },
    });

    return NextResponse.json({ success: true, provider: updated.provider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
