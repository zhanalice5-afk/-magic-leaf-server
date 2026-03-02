import { ASRClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { getCozeConfig, canUseAIFeatures } from "../config/cozeConfig.js";

export interface RecognizeSpeechParams {
  audioUrl?: string; // 音频文件URL
  audioBase64?: string; // Base64编码的音频数据
  headers?: Record<string, string>;
}

export interface RecognizedSpeech {
  text: string;
  duration?: number; // 音频时长（毫秒）
}

/**
 * 语音识别服务
 * 用于将语音转换为文字，支持语音输入兴趣标签等功能
 */
export async function recognizeSpeech(
  params: RecognizeSpeechParams
): Promise<RecognizedSpeech> {
  const { audioUrl, audioBase64, headers } = params;

  if (!audioUrl && !audioBase64) {
    throw new Error("Either audioUrl or audioBase64 is required");
  }

  // 检查是否可以使用 AI 功能
  if (!canUseAIFeatures()) {
    throw new Error('语音识别功能暂不可用。请配置 COZE_API_KEY 环境变量。');
  }

  const config = getCozeConfig();
  const client = new ASRClient(config, headers);

  try {
    const response = await client.recognize({
      uid: `magic-leaf-user-${Date.now()}`,
      url: audioUrl,
      base64Data: audioBase64,
    });

    return {
      text: response.text,
      duration: response.duration,
    };
  } catch (error) {
    console.error("Error recognizing speech:", error);
    throw error;
  }
}

/**
 * 从录音文件识别语音
 * 用于处理用户上传的录音文件
 */
export async function recognizeFromRecording(
  audioBuffer: Buffer,
  headers?: Record<string, string>
): Promise<RecognizedSpeech> {
  const audioBase64 = audioBuffer.toString("base64");
  return recognizeSpeech({ audioBase64, headers });
}
