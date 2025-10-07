# Gemini AI Disaster Image Analysis Setup Guide

## Overview
This feature uses Google's Gemini 1.5 Flash AI model to analyze disaster images and provide intelligent safety guidance and recommendations.

## Features
- 📸 **Image Upload & Analysis**: Upload disaster photos for instant AI analysis
- 🔍 **Disaster Type Detection**: Identifies floods, fires, earthquakes, storms, etc.
- 🚨 **Severity Assessment**: Rates disaster severity (Low/Medium/High/Critical)
- 🛡️ **Safety Recommendations**: Provides immediate actionable safety advice
- 📋 **Emergency Supplies**: Lists required emergency supplies
- 🚪 **Evacuation Guidance**: Advises on evacuation if necessary
- 🌍 **Location-Aware**: Considers user's location in recommendations

## Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy your API key

### Step 2: Add API Key to Environment Variables

#### For Local Development:
1. Create `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

#### For Vercel Deployment:
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application

### Step 3: Test the Feature

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `/ai-image` page
3. Upload a disaster image (or use a sample image)
4. Click **"Analyze"**
5. Wait for AI analysis (usually 2-5 seconds)

## Usage Guide

### For End Users:

1. **Navigate to AI Image Analysis**:
   - Go to `/ai-image` page
   - Or add a navigation link to your menu

2. **Upload an Image**:
   - Click the "Upload" button
   - Select an image from your device
   - Or drag and drop an image

3. **Add Context (Optional)**:
   - Type additional information about the situation
   - Example: "This is happening near my house"
   - Example: "Water level is rising quickly"

4. **Analyze**:
   - Click "Analyze" button
   - Wait for AI response
   - Read the detailed analysis and follow recommendations

### Sample Disaster Scenarios:

- **Flood**: Upload flood image → Get water safety advice
- **Fire**: Upload fire image → Get evacuation guidance
- **Earthquake**: Upload structural damage → Get shelter-in-place advice
- **Storm**: Upload storm damage → Get emergency preparedness tips

## API Endpoints

### POST `/api/ai/analyze-image`

Analyzes a disaster image using Gemini AI.

**Request Body**:
```json
{
  "image": "base64_encoded_image_string",
  "prompt": "Optional custom prompt"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": "AI-generated analysis text",
  "metadata": {
    "model": "gemini-1.5-flash",
    "timestamp": "2025-10-07T..."
  }
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Gemini AI Models

### Currently Used: `gemini-1.5-flash`
- **Speed**: Fast (2-5 seconds)
- **Cost**: Lower cost
- **Quality**: High quality for most use cases
- **Best for**: Real-time disaster analysis

### Alternative: `gemini-1.5-pro`
To use the more powerful Pro model, change in `/api/ai/analyze-image/route.js`:
```javascript
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
```

**Benefits**:
- More detailed analysis
- Better accuracy
- More nuanced recommendations

**Drawbacks**:
- Slower (5-10 seconds)
- Higher cost per request

## Pricing & Limits

### Gemini 1.5 Flash (Current Model):
- **Free Tier**: 15 requests per minute
- **Paid Tier**: Higher limits, pay per request
- **Cost**: ~$0.001 per image analysis

### Best Practices:
- Cache results when possible
- Implement rate limiting
- Set usage alerts
- Monitor API usage in Google Cloud Console

## Customization

### Modify AI Prompt
Edit `/api/ai/analyze-image/route.js` to customize the analysis prompt:

```javascript
text: `You are an expert disaster response AI assistant. Analyze this disaster image and provide:
1. YOUR CUSTOM INSTRUCTIONS
2. YOUR SPECIFIC REQUIREMENTS
3. YOUR DESIRED OUTPUT FORMAT
...`
```

### Add More Features:
- **Multiple Images**: Analyze multiple images at once
- **Voice Input**: Add speech-to-text for verbal context
- **Real-time Camera**: Capture images directly from camera
- **History**: Save analysis history for reference
- **Emergency Contacts**: Auto-suggest emergency contacts based on disaster type

## Troubleshooting

### Error: "Gemini API key not configured"
**Solution**: Add `GEMINI_API_KEY` to environment variables

### Error: "Failed to analyze image"
**Possible Causes**:
- Invalid API key
- API quota exceeded
- Image too large (>10MB)
- Network connection issues
- Image format not supported

**Solutions**:
- Verify API key is correct
- Check API quota in Google Cloud Console
- Compress images before upload
- Try again with better internet connection
- Use JPEG/PNG formats

### Error: "Image size must be less than 10MB"
**Solution**: Compress image or use a smaller image

### Slow Response Times
**Solutions**:
- Switch to faster internet connection
- Use `gemini-1.5-flash` instead of `gemini-1.5-pro`
- Optimize image size before upload
- Check API status at [Google Status Page](https://status.cloud.google.com/)

### Poor Analysis Quality
**Solutions**:
- Use clear, well-lit images
- Ensure disaster is visible in image
- Add context in text field
- Try multiple angles/images
- Use higher resolution images

## Security Considerations

1. **Never commit API keys to Git**:
   - Use `.env.local` for local development
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

2. **Rate Limiting**:
   - Implement rate limiting to prevent abuse
   - Set up API quotas in Google Cloud Console

3. **Image Validation**:
   - Already implemented: File size check (10MB)
   - Already implemented: File type check (images only)
   - Consider adding: Content safety filters

4. **User Authentication**:
   - Consider requiring login for API access
   - Track usage per user
   - Implement usage limits per user

## Advanced Features (Future Enhancements)

1. **Batch Analysis**: Analyze multiple images simultaneously
2. **Video Analysis**: Analyze video clips of disasters
3. **Real-time Streaming**: Live analysis from camera feed
4. **Multi-language Support**: AI responses in user's language
5. **Offline Mode**: Cache common analyses for offline use
6. **Integration with Emergency Services**: Auto-alert authorities
7. **Community Sharing**: Share analyses with other users
8. **Historical Data**: Compare with past disaster data

## Support Resources

- **Gemini API Documentation**: https://ai.google.dev/docs
- **Google AI Studio**: https://makersuite.google.com
- **API Reference**: https://ai.google.dev/api/rest
- **Community Forum**: https://discuss.ai.google.dev
- **Status Page**: https://status.cloud.google.com

## Integration with Existing Features

### Link from Main Dashboard:
Add to your navigation:
```jsx
<Link href="/ai-image">
  <FiCamera /> AI Image Analysis
</Link>
```

### Quick Access Button:
Add to disaster map or user dashboard:
```jsx
<button onClick={() => router.push('/ai-image')}>
  📸 Analyze Disaster Image
</button>
```

## Testing Checklist

- [ ] API key is configured
- [ ] Can upload images
- [ ] Images preview correctly
- [ ] Analysis completes successfully
- [ ] AI response is relevant and helpful
- [ ] Error handling works (wrong file type, too large, etc.)
- [ ] Mobile responsive design works
- [ ] Loading states display correctly
- [ ] Can send multiple requests
- [ ] Geolocation integration works

## Conclusion

You now have a powerful AI-powered disaster image analysis feature! Users can upload disaster photos and receive instant, intelligent guidance powered by Google's cutting-edge Gemini AI.

For questions or issues, refer to the official documentation or create an issue in your repository.

Stay safe! 🛡️
