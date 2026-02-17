
  import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import fetch from "node-fetch";

// Increase timeout for large base64 images (up to 2 minutes)
export const maxDuration = 120; // 2 minutes for Vercel/Next.js
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 🔧 FIX: Prioritize request body values over environment variables
    // First priority: bot_token and chat_id from request body (supports template variables)
    // Second priority: Fallback to environment variables if not provided in request
    let { bot_token: requestBotToken, chat_id: requestChatId, mediaType, mediaUrl, caption, message, parse_mode } = body;
    
    // Use request body values first, fallback to .env only if not provided
    const bot_token = requestBotToken || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chat_id = requestChatId || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    // Validate required fields
    if (!bot_token || !chat_id) {
      return NextResponse.json(
        { success: false, error: "bot_token and chat_id are required. Please provide them in the request body or set NEXT_PUBLIC_TELEGRAM_BOT_TOKEN and NEXT_PUBLIC_TELEGRAM_CHAT_ID in .env" },
        { status: 400 }
      );
    }

    // ---- TEXT MESSAGE ----
    if (!mediaType || mediaType === "none") {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for text

      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${bot_token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: message,
              parse_mode: parse_mode || "HTML"
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);
        const tgJson = await tgRes.json();

        return NextResponse.json({
          success: true,
          telegram: tgJson
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          return NextResponse.json(
            { success: false, error: "Request timeout" },
            { status: 504 }
          );
        }
        throw error;
      }
    }

    // ---- BASE64 MEDIA HANDLING ----
    if (mediaUrl && (mediaUrl.startsWith("data:image") || mediaUrl.startsWith("data:video") || mediaUrl.startsWith("data:"))) {
      try {
        // Extract base64 data and mime type
        const base64Match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!base64Match) {
          return NextResponse.json(
            { success: false, error: "Invalid base64 data URL format" },
            { status: 400 }
          );
        }

        const mimeType = base64Match[1];
        const base64Data = base64Match[2];
        
        // Decode base64 to buffer (this can take time for large images)
        const buffer = Buffer.from(base64Data, "base64");
        
        // Determine file extension and Telegram endpoint based on media type
        let endpoint = "sendPhoto";
        let fieldName = "photo";
        let filename = "image.png";
        
        if (mimeType.startsWith("video/")) {
          endpoint = "sendVideo";
          fieldName = "video";
          filename = "video.mp4";
        } else if (mimeType.includes("pdf") || mimeType.includes("document")) {
          endpoint = "sendDocument";
          fieldName = "document";
          filename = "document.pdf";
        } else if (mimeType.startsWith("image/")) {
          // Determine image extension
          if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
            filename = "image.jpg";
          } else if (mimeType.includes("png")) {
            filename = "image.png";
          } else if (mimeType.includes("gif")) {
            filename = "image.gif";
          }
        }

        const form = new FormData();
        form.append("chat_id", chat_id);
        form.append(fieldName, buffer, {
          filename: filename,
          contentType: mimeType
        });

        if (caption) {
          form.append("caption", caption);
          form.append("parse_mode", parse_mode || "HTML");
        }

        // Extended timeout for large media uploads (up to 2 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${bot_token}/${endpoint}`,
            {
              method: "POST",
              body: form as any, // FormData compatibility
              signal: controller.signal
            }
          );

          clearTimeout(timeoutId);
          const tgJson = await tgRes.json();

          if (!tgJson.ok) {
            return NextResponse.json({
              success: false,
              error: tgJson.description || "Telegram API error",
              telegram: tgJson
            }, { status: 500 });
          }

          // ✅ Return success response
          return NextResponse.json({
            success: true,
            telegram: tgJson
          });
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            return NextResponse.json(
              { success: false, error: "Upload timeout - image too large or slow connection" },
              { status: 504 }
            );
          }
          throw error;
        }
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message || "Failed to process base64 media" },
          { status: 500 }
        );
      }
    }

    // ---- PUBLIC URL MEDIA ----
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for URL media

    try {
      const tgRes = await fetch(
        `https://api.telegram.org/bot${bot_token}/sendPhoto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            photo: mediaUrl,
            caption,
            parse_mode: parse_mode || "HTML"
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      const tgJson = await tgRes.json();

      return NextResponse.json({
        success: true,
        telegram: tgJson
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: "Request timeout" },
          { status: 504 }
        );
      }
      throw error;
    }

  } catch (err: any) {
    // Return proper error response
    return NextResponse.json({
      success: false,
      error: err.message || "Telegram send failed"
    }, { status: 500 });
  }
}

  