import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const body = await request.json();
    const { formId } = params;
    
    console.log('📝 Form submission received:', { formId, body });
    
    // For now, just return a success response
    // In a real application, you would save to database here
    const response = {
      success: true,
      message: `${formId} created successfully`,
      data: {
        id: `${Math.random().toString(36).substring(2, 15)}`,
        ...body
      }
    };
    
    console.log('✅ Form submission successful:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Form submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Form submission failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  const { formId } = params;
  
  return NextResponse.json({
    message: `Form endpoint ${formId} is active`,
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}
