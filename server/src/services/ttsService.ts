import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { getCozeConfig, canUseAIFeatures } from "../config/cozeConfig.js";

export interface SynthesizeSpeechParams {
  text: string;
  language: "en" | "zh"; // 英文或中文
  headers?: Record<string, string>;
}

export interface SynthesizedAudio {
  audioUri: string;
  audioSize: number;
}

// 语音配置 - 为儿童绘本选择最适合的声音
const VOICE_CONFIG = {
  // 中文声音：温暖亲切的儿童有声书风格
  zh: {
    speaker: "zh_female_xueayi_saturn_bigtts",
    speechRate: 0, // 正常语速
  },
  // 英文声音：使用支持中英文的清晰女声，稍慢语速便于儿童理解
  en: {
    speaker: "zh_female_vv_uranus_bigtts", // 支持 Chinese & English，发音清晰
    speechRate: -15, // 稍慢，便于儿童磨耳朵学习
  },
};

/**
 * 语音合成服务
 * 为儿童绘本提供温暖亲切的语音朗读
 * 中文使用儿童有声书风格，英文使用清晰标准发音
 */
export async function synthesizeSpeech(
  params: SynthesizeSpeechParams
): Promise<SynthesizedAudio> {
  const { text, language, headers } = params;

  // 检查是否可以使用 AI 功能
  if (!canUseAIFeatures()) {
    throw new Error('语音合成功能暂不可用。请配置 COZE_API_KEY 环境变量。');
  }

  const config = getCozeConfig();
  const client = new TTSClient(config, headers);

  const voiceConfig = VOICE_CONFIG[language];

  try {
    const response = await client.synthesize({
      uid: `magic-leaf-user-${Date.now()}`,
      text,
      speaker: voiceConfig.speaker,
      audioFormat: "mp3",
      sampleRate: 24000, // 标准音质
      speechRate: voiceConfig.speechRate,
      loudnessRate: 0,
    });

    return {
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    };
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw error;
  }
}

/**
 * 为绘本页面生成中英文双语音频
 */
export async function synthesizePageAudio(
  textEn: string,
  textZh: string,
  headers?: Record<string, string>
): Promise<{ englishAudio: SynthesizedAudio; chineseAudio: SynthesizedAudio }> {
  const [englishAudio, chineseAudio] = await Promise.all([
    synthesizeSpeech({ text: textEn, language: "en", headers }),
    synthesizeSpeech({ text: textZh, language: "zh", headers }),
  ]);

  return { englishAudio, chineseAudio };
}

/**
 * 批量合成多个文本的音频
 */
export async function synthesizeMultiple(
  texts: Array<{ text: string; language: "en" | "zh" }>,
  headers?: Record<string, string>
): Promise<SynthesizedAudio[]> {
  return Promise.all(
    texts.map((item) => synthesizeSpeech({ ...item, headers }))
  );
}
