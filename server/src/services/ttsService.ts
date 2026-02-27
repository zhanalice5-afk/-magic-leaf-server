import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export interface SynthesizeSpeechParams {
  text: string;
  language: "en" | "zh"; // 英文或中文
  headers?: Record<string, string>;
}

export interface SynthesizedAudio {
  audioUri: string;
  audioSize: number;
}

/**
 * 语音合成服务
 * 为儿童绘本提供温暖亲切的语音朗读
 */
export async function synthesizeSpeech(
  params: SynthesizeSpeechParams
): Promise<SynthesizedAudio> {
  const { text, language, headers } = params;

  const config = new Config();
  const client = new TTSClient(config, headers);

  // 根据语言选择合适的语音
  // 英文使用儿童有声书风格，中文使用亲切的女声
  const speaker =
    language === "en"
      ? "zh_female_xueayi_saturn_bigtts" // 儿童有声书风格，支持中英文
      : "zh_female_xueayi_saturn_bigtts"; // 儿童有声书风格

  try {
    const response = await client.synthesize({
      uid: `magic-leaf-user-${Date.now()}`,
      text,
      speaker,
      audioFormat: "mp3",
      sampleRate: 24000, // 标准音质
      speechRate: language === "en" ? -10 : 0, // 英文稍慢，便于儿童理解
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
