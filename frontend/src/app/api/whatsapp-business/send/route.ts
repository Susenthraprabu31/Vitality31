import { NextRequest, NextResponse } from 'next/server';

interface WhatsAppMessage {
  to: string;
  text?: string;
  api_key: string;
  phone_number_id?: string;
  business_account_id?: string;
  api_version?: string;
  media?: {
    type: 'image' | 'document' | 'video' | 'audio';
    url?: string;
    base64?: string;
    caption?: string;
    filename?: string;
  };
  template?: {
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    components?: any[];
  };
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<WhatsAppResponse>> {
  try {
    const { to, text, api_key, media, template, phone_number_id, business_account_id, api_version }: WhatsAppMessage = await request.json();

    // Validate required fields
    if (!to || !api_key) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, api_key' },
        { status: 400 }
      );
    }

    // Validate message content (text, media, or template required)
    if (!text && !media && !template) {
      return NextResponse.json(
        { success: false, error: 'Message content required: text, media, or template' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be in international format (+1234567890)' },
        { status: 400 }
      );
    }

    // Validate message length (only if text is provided)
    if (text && text.length > 4096) {
      return NextResponse.json(
        { success: false, error: 'Message text exceeds 4096 character limit' },
        { status: 400 }
      );
    }

    if (media) {
      if (media.base64) {
        console.log('📎 Base64 media size:', media.base64.length, 'characters');
      }
    }

    // Prepare WhatsApp Business Cloud API request (v20.0 - Latest 2024)
    const apiVersionToUse = api_version || 'v20.0';
    const whatsappApiUrl = process.env.WHATSAPP_BUSINESS_API_URL || `https://graph.facebook.com/${apiVersionToUse}`;
    // Prefer server env vars; fall back to request body when missing
    const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID || phone_number_id;
    let accessToken = process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN || api_key;
    if (accessToken === 'MISSING_API_KEY') accessToken = process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN || '';

    if (!phoneNumberId) {
      // Phone Number ID missing
      return NextResponse.json(
        { success: false, error: 'WhatsApp Business API Phone Number ID required - set WHATSAPP_BUSINESS_PHONE_NUMBER_ID in .env(.local) or pass phone_number_id' },
        { status: 500 }
      );
    }

    if (!accessToken) {
      // Access token missing
      return NextResponse.json(
        { success: false, error: 'WhatsApp Business API access token required' },
        { status: 401 }
      );
    }

    // Build WhatsApp Cloud API payload (2024 specification)
    let messagePayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/[^\d]/g, ''),
      type: template ? 'template' : (media ? media.type : 'text')
    };

    if (template) {
      // Template message for Marketing/Utility/Authentication
      messagePayload.template = {
        name: template.name,
        language: {
          code: template.language || 'en'
        }
      };
      if (template.components) {
        messagePayload.template.components = template.components;
      }
      // Template send
    } else if (media) {
      // Message with media - handle base64 images by uploading to WhatsApp Media API
      let mediaId = null;
      let mediaUrl: string | undefined = media.url;
      
      // Check if media is base64 encoded (new base64 field or legacy URL format)
      if (media.base64 || (mediaUrl && (mediaUrl.startsWith('data:') || mediaUrl.includes('base64')))) {
        // Upload base64 media to WhatsApp Media API
        
        try {
          // Extract base64 data and content type
          let base64Data;
          let contentType = 'image/jpeg'; // default
          
          if (media.base64) {
            // New base64 field approach
            base64Data = media.base64;
            // Determine content type from media type
            const typeMapping = {
              'image': 'image/jpeg',
              'video': 'video/mp4',
              'audio': 'audio/mpeg',
              'document': 'application/pdf'
            };
            contentType = typeMapping[media.type] || 'application/octet-stream';
          } else if (mediaUrl && mediaUrl.startsWith('data:')) {
            // Legacy data URL format
            const [header, data] = mediaUrl.split(',');
            base64Data = data;
            const contentTypeMatch = header.match(/data:([^;]+);/);
            if (contentTypeMatch) {
              contentType = contentTypeMatch[1];
            }
          } else {
            // Raw base64 string
            base64Data = mediaUrl;
          }
          
          if (!base64Data) {
            throw new Error('Invalid base64 media data');
          }

          // Convert base64 to binary
          const binaryData = Buffer.from(base64Data, 'base64');
          const arrayBuffer = binaryData.buffer.slice(
            binaryData.byteOffset,
            binaryData.byteOffset + binaryData.byteLength
          );
          
          // Create form data for media upload
          const formData = new FormData();
          const blob = new Blob([arrayBuffer], { type: contentType });
          formData.append('file', blob, media.filename || 'image.jpg');
          formData.append('type', media.type);
          formData.append('messaging_product', 'whatsapp');
          
          // Upload to WhatsApp Media API
          const uploadResponse = await fetch(`${whatsappApiUrl}/${phoneNumberId}/media`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
              // Note: Don't set Content-Type header when using FormData
            },
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            mediaId = uploadResult.id;
            // Media uploaded successfully
          } else {
            const uploadError = await uploadResponse.json().catch(() => ({}));
            // Media upload failed
            throw new Error(`Media upload failed: ${uploadResponse.status} - ${uploadError.error?.message || 'Unknown error'}`);
          }
        } catch (uploadError: unknown) {
          // Error uploading base64 media
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          return NextResponse.json(
            { success: false, error: `Media upload failed: ${uploadErrorMessage}` },
            { status: 500 }
          );
        }
      }
      
      // Build media payload
      if (mediaId) {
        // Use uploaded media ID
        messagePayload[media.type] = {
          id: mediaId
        };
      } else {
        if (!mediaUrl) {
          return NextResponse.json(
            { success: false, error: 'Media URL is required when sending WhatsApp media messages' },
            { status: 400 }
          );
        }
        // Use direct URL (for publicly accessible URLs)
        messagePayload[media.type] = {
          link: mediaUrl
        };
      }
      
      if (text) {
        messagePayload[media.type].caption = text;
      }
      if (media.filename && media.type === 'document') {
        messagePayload[media.type].filename = media.filename;
      }
    } else {
      // Text-only message
      messagePayload.text = {
        preview_url: text && text.includes('http') ? true : false,
        body: text || ''
      };
    }

    // Send to WhatsApp Business API
    const response = await fetch(`${whatsappApiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific WhatsApp API error codes
      let errorMessage = 'WhatsApp API error';
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error.error_user_msg || errorMessage;
        
        // Common WhatsApp API error codes
        switch (errorData.error.code) {
          case 131000:
            errorMessage = 'Generic user error. Please check your request format.';
            break;
          case 131005:
            errorMessage = 'Generic user error: Invalid phone number.';
            break;
          case 131008:
            errorMessage = 'Required parameter is missing.';
            break;
          case 131009:
            errorMessage = 'Parameter value is not valid.';
            break;
          case 131014:
            errorMessage = 'Template does not exist or is not approved.';
            break;
          case 131021:
            errorMessage = 'Recipient phone number not a WhatsApp user.';
            break;
          case 131026:
            errorMessage = 'Message undeliverable - user may have blocked you.';
            break;
          case 131031:
            errorMessage = 'Media download failed or unsupported format.';
            break;
          case 131047:
            errorMessage = 'Re-engagement message - user needs to message you first.';
            break;
          case 131051:
            errorMessage = 'Unsupported message type.';
            break;
          case 133004:
            errorMessage = 'Request timeout. Please try again.';
            break;
          case 133005:
            errorMessage = 'Access token is invalid or expired.';
            break;
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          whatsapp_error: errorData.error,
          status_code: response.status
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // WhatsApp message sent successfully

    // Extract response data
    const messageId = result.messages?.[0]?.id;
    const messageStatus = result.messages?.[0]?.message_status || 'accepted';

    return NextResponse.json({
      success: true,
      messageId,
      status: messageStatus,
      to: messagePayload.to,
      type: messagePayload.type,
      timestamp: new Date().toISOString(),
      metadata: {
        api_version: 'v20.0',
        provider: 'whatsapp-business-cloud',
        has_media: !!media,
        is_template: !!template,
        template_category: template?.category || null,
        message_length: text?.length || 0
      },
      whatsapp_response: result
    });

  } catch (error: unknown) {
    // Error sending WhatsApp message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(' WhatsApp Business API error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}