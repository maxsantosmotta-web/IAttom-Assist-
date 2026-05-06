export interface FoundProduct {
  name: string;
  category: string;
  score: number;
  demand: string;
  margin: string;
  trend: string;
  whyNow: string;
  targetAudience: string;
  keySellingPoints: string[];
  competition: string;
  estimatedMonthlyRevenue: string;
}

export interface FindProductsResult {
  products: FoundProduct[];
  marketInsight: string;
  topPick: string;
}

export interface ValidationResult {
  score: number;
  verdict: string;
  marketSize: string;
  competition: string;
  buyerIntentScore: number;
  profitabilityRating: string;
  strengths: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  launchStrategy: string;
  pricingInsight: string;
  demandTrend: string;
}

export interface CampaignResult {
  headline: string;
  subheadline: string;
  cta: string;
  audience: string;
  channels: string[];
  budget: string;
  copy: {
    facebook: string;
    instagram: string;
    google: string;
    email: string;
    tiktok: string;
  };
  keyMessages: string[];
  launchTimeline: string;
  uniqueAngle: string;
  objectionHandling: string;
}

export interface ContentResult {
  blog: string;
  social: string;
  email: string;
  tweetThread: string;
  smsText: string;
  seoTitle: string;
  seoDescription: string;
}

export interface CreativeConcept {
  id: number;
  label: string;
  format: string;
  concept: string;
  visualDirection: string;
  copyHook: string;
  bodyText: string;
  cta: string;
  emotionalTrigger: string;
  bestPlatform: string;
  imagePrompt: string;
}

export interface CreativeIdeasResult {
  concepts: CreativeConcept[];
  overarchingTheme: string;
  colorPalette: string;
  typographyDirection: string;
  brandVoiceNotes: string;
}

export interface ScriptScene {
  time: string;
  visual: string;
  script: string;
  emotion: string;
  direction: string;
}

export interface VideoScriptResult {
  title: string;
  duration: string;
  hooks: string[];
  scenes: ScriptScene[];
  voiceoverStyle: string;
  musicMood: string;
  editingPace: string;
  captionStyle: string;
  viralTrigger: string;
  distributionTips: string[];
}
