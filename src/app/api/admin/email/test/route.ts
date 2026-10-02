import { NextResponse } from "next/server";
import { testSmtpConnection } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { recipient } = await req.json();
    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid recipient email" }, { status: 400 });
    }

    const result = await testSmtpConnection(recipient);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to execute SMTP test" }, { status: 500 });
  }
}
