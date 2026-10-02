import { NextResponse } from "next/server";
import { getSmtpConfig, saveSmtpConfig } from "@/lib/email";

export async function GET() {
  try {
    const config = await getSmtpConfig();
    return NextResponse.json({
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      hasPass: Boolean(config.pass),
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      adminAlertEmail: config.adminAlertEmail,
      enabled: config.enabled,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load SMTP settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updateData: any = {
      host: body.host,
      port: Number(body.port) || 587,
      secure: Boolean(body.secure),
      user: body.user,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      adminAlertEmail: body.adminAlertEmail,
      enabled: Boolean(body.enabled),
    };

    // Only update pass if a new one is provided
    if (body.pass && body.pass.trim().length > 0) {
      updateData.pass = body.pass.trim();
    }

    const saved = await saveSmtpConfig(updateData);
    return NextResponse.json({
      success: true,
      settings: {
        host: saved.host,
        port: saved.port,
        secure: saved.secure,
        user: saved.user,
        fromEmail: saved.fromEmail,
        fromName: saved.fromName,
        adminAlertEmail: saved.adminAlertEmail,
        enabled: saved.enabled,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save SMTP settings" }, { status: 500 });
  }
}
