export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram';

export type PostTone = 'professional' | 'witty' | 'urgent' | 'inspirational' | 'educational';

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export type ImageSize = '1K' | '2K' | '4K';

export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-3.1-flash-image-preview';

export interface ImageConfig {
  model: ImageModel;
  size: ImageSize;
  aspectRatio: AspectRatio;
  prompt: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  errorMessage?: string;
}

export interface PostDraft {
  platform: SocialPlatform;
  content: string;
  hook: string;
  hashtags: string[];
  callToAction: string;
  characterCount: number;
  wordCount: number;
  targetMaxCharacters?: number;
  imagePrompt: string;
  imageConfig: ImageConfig;
}

export interface CampaignData {
  id: string;
  idea: string;
  tone: PostTone;
  targetAudience?: string;
  createdAt: string;
  posts: Record<SocialPlatform, PostDraft>;
}

export interface PostAnalysis {
  platform: SocialPlatform;
  engagementScore: number; // 1-100
  viralityPotential: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Baja' | 'Moderada' | 'Alta' | 'Muy Alta' | string;
  hookAnalysis: {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    suggestedHook: string;
  };
  pacingAndReadability: string;
  recommendedPostTime: string;
  algorithmTips: string[];
}
