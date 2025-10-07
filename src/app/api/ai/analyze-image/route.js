import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { image, prompt } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Detect image MIME type from base64 prefix or default to jpeg
    let mimeType = 'image/jpeg';
    if (image.includes('data:image/png')) mimeType = 'image/png';
    else if (image.includes('data:image/webp')) mimeType = 'image/webp';
    else if (image.includes('data:image/gif')) mimeType = 'image/gif';

    // Call Gemini AI API for image analysis - updated to use current model gemini-2.5-flash
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt || `Analyze this disaster image briefly and provide:

🔍 **DISASTER TYPE**: [Type] | **SEVERITY**: [Low/Medium/High/Critical]

⚠️ **IMMEDIATE DANGERS**:
• [2-3 key hazards]

🛡️ **SAFETY ACTIONS**:
• [3-4 immediate actions to take]

🆘 **EMERGENCY**:
• **Evacuate?**: [Yes/No - brief reason]
• **Contact**: [Which emergency services]
• **Supplies**: [3-4 essential items]

📋 **NEXT STEPS**:
• [2-3 short-term actions for next 24 hours]

Keep it concise, clear, and actionable. Maximum 150 words total.`
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error - Status:', geminiResponse.status, 'Details:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze image with Gemini AI', details: errorData },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    
    // Extract the AI response
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to analyze the image.';

    return NextResponse.json({
      success: true,
      analysis: aiResponse,
      metadata: {
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in Gemini AI analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}