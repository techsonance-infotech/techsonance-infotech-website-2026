export type ProviderCategory = "text" | "image";

export interface ProviderModelOption {
  id: string;
  label: string;
}

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  category: ProviderCategory;
  defaultModel: string;
  models: ProviderModelOption[];
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  // Text LLM Providers
  {
    id: "groq",
    name: "Groq (LPU Inference)",
    category: "text",
    defaultModel: "openai/gpt-oss-120b",
    models: [
      { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B (Active - Ultra Fast)" },
      { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B (Groq Hosted)" },
      { id: "qwen/qwen3.8-27b", label: "Alibaba Qwen 3.8 27B (Groq Hosted)" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "text",
    defaultModel: "gemini-3.5-flash-lite",
    models: [
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite (Fast & Active)" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Production General)" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Latest)" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep Code & Reasoning)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "text",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o (Omni Flagship)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Affordable & Fast)" },
      { id: "gpt-5-mini", label: "GPT-5 Mini (Fast Next-Gen)" },
      { id: "gpt-5.2-pro", label: "GPT-5.2 Pro (Deep Reasoning)" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "text",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (Sub-second)" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    category: "text",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek-V3 (deepseek-chat)" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1 (deepseek-reasoner)" },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras (Ultra-Fast)",
    category: "text",
    defaultModel: "llama-3.3-70b",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "llama3.1-8b", label: "Llama 3.1 8B" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    category: "text",
    defaultModel: "grok-2-latest",
    models: [
      { id: "grok-2-latest", label: "Grok 2" },
      { id: "grok-2-vision-latest", label: "Grok 2 Vision" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    category: "text",
    defaultModel: "mistral-small-latest",
    models: [
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "codestral-latest", label: "Codestral" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "text",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B Free" },
      { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 Free" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI (LLMs & Text)",
    category: "text",
    defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    models: [
      {
        id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        label: "Llama 3.3 70B Instruct FP8 Fast",
      },
      { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 Distill Qwen 32B" },
      { id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct (High Speed)" },
      { id: "@cf/qwen/qwen2.5-72b-instruct", label: "Qwen 2.5 72B Instruct" },
    ],
  },
  {
    id: "github",
    name: "GitHub Models (Azure AI)",
    category: "text",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "Phi-4", label: "Microsoft Phi-4" },
    ],
  },

  // Image Generation Providers
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI (FLUX & Diffusion)",
    category: "image",
    defaultModel: "@cf/black-forest-labs/flux-1-schnell",
    models: [
      {
        id: "@cf/black-forest-labs/flux-1-schnell",
        label: "FLUX.1-schnell (12B - Fast JSON 16:9)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-klein-9b",
        label: "FLUX.2 klein 9B (4-Step SOTA)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-klein-4b",
        label: "FLUX.2 klein 4B (Ultra-Low Latency)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-dev",
        label: "FLUX.2 dev (Maximum Photorealism)",
      },
      {
        id: "@cf/leonardo/lucid-origin",
        label: "Leonardo.ai Lucid Origin (Graphic Design)",
      },
      {
        id: "@cf/leonardo/phoenix-1.0",
        label: "Leonardo.ai Phoenix 1.0 (Prompt Coherence)",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini (Image Generation)",
    category: "image",
    defaultModel: "models/gemini-3.1-flash-image",
    models: [
      { id: "models/gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image (Recommended)" },
      { id: "models/gemini-3.1-flash-lite-image", label: "Gemini 3.1 Flash Lite Image (Fast)" },
      { id: "models/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
      { id: "models/gemini-3-pro-image", label: "Gemini 3 Pro Image (High Detail)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI (GPT Image Generation)",
    category: "image",
    defaultModel: "gpt-image-1.5",
    models: [
      { id: "gpt-image-1.5", label: "GPT Image 1.5 (Photorealistic 1536x1024)" },
      { id: "gpt-image-2", label: "GPT Image 2 (Latest Flagship)" },
      { id: "gpt-image-1-mini", label: "GPT Image 1 Mini (Fast & Budget)" },
      { id: "chatgpt-image-latest", label: "ChatGPT Image Latest" },
      { id: "dall-e-3", label: "DALL-E 3 (Legacy Org Keys Only)" },
    ],
  },
  {
    id: "pollinations",
    name: "Pollinations.ai (FLUX / Z-Image / MAI)",
    category: "image",
    defaultModel: "black-forest-labs/flux.1-schnell",
    models: [
      {
        id: "black-forest-labs/flux.1-schnell",
        label: "FLUX.1 Schnell (Fast & Reliable)",
      },
      {
        id: "black-forest-labs/flux.2-klein-4b",
        label: "FLUX.2 Klein 4B (Sharp Editorial)",
      },
      {
        id: "tongyi-mai/z-image-turbo",
        label: "Z-Image Turbo (Budget Fast Upscaled)",
      },
      {
        id: "black-forest-labs/flux.1.1-pro",
        label: "FLUX 1.1 Pro (High Fidelity)",
      },
      {
        id: "microsoft/mai-image-2.6",
        label: "Microsoft MAI Image 2.6",
      },
    ],
  },
  {
    id: "replicate",
    name: "Replicate (FLUX & Diffusion)",
    category: "image",
    defaultModel: "black-forest-labs/flux-schnell",
    models: [
      { id: "black-forest-labs/flux-schnell", label: "FLUX Schnell (Replicate)" },
      { id: "black-forest-labs/flux-dev", label: "FLUX Dev (High Detail)" },
      { id: "stability-ai/sdxl", label: "Stability AI SDXL" },
    ],
  },
  {
    id: "stability",
    name: "Stability AI (Stable Diffusion)",
    category: "image",
    defaultModel: "stable-diffusion-3.5-large",
    models: [
      { id: "stable-diffusion-3.5-large", label: "Stable Diffusion 3.5 Large" },
      { id: "sd3-medium", label: "SD3 Medium" },
      { id: "core", label: "Stable Image Core" },
    ],
  },
  {
    id: "custom",
    name: "Custom / Self-Hosted Provider",
    category: "text",
    defaultModel: "custom-model",
    models: [],
  },
];

const TEXT_LLM_PATTERNS = ["llama", "deepseek", "qwen", "mistral", "gpt-4", "gpt-5", "claude", "phi-"];

/**
 * Determines whether a stored credential is configured for image generation rather than text LLM inference.
 */
export function isImageCredentialModel(provider: string, model?: string | null): boolean {
  const p = provider.toLowerCase();
  const m = (model || "").toLowerCase();

  if (p === "pollinations" || p === "replicate" || p === "stability") {
    return true;
  }

  if (
    m.includes("flux") ||
    m.includes("diffusion") ||
    m.includes("image") ||
    m.includes("imagen") ||
    m.includes("dall-e") ||
    m.includes("leonardo") ||
    m.includes("lucid") ||
    m.includes("phoenix") ||
    m.includes("nano-banana") ||
    m.includes("klein")
  ) {
    return true;
  }

  if (p === "cloudflare") {
    return !TEXT_LLM_PATTERNS.some((pattern) => m.includes(pattern));
  }

  return false;
}
