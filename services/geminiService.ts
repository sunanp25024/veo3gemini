import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ImageFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const pollOperation = async (operation: any) => {
  let currentOperation = operation;
  while (!currentOperation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
    try {
      currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
    } catch (error) {
      console.error("Error polling operation:", error);
      throw new Error("Failed while checking video generation status.");
    }
  }
  return currentOperation;
};

export const generateVideo = async (
  prompt: string,
  image: ImageFile | null,
  config: GenerationConfig,
  setLoadingMessage: (message: string) => void
): Promise<string> => {
  setLoadingMessage("Initializing video generation...");
  
  const requestPayload: any = {
    model: config.model,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
    }
  };

  if (image) {
    requestPayload.image = {
      imageBytes: image.base64,
      mimeType: image.file.type,
    };
  }

  try {
    let operation = await ai.models.generateVideos(requestPayload);
    
    setLoadingMessage("Video generation in progress... This may take several minutes.");
    
    const completedOperation = await pollOperation(operation);

    const downloadLink = completedOperation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation completed, but no video URI was found in the response.");
    }
    
    setLoadingMessage("Downloading generated video...");

    // Append API key for fetching the video content
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video. Status: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    setLoadingMessage("Done!");
    
    return videoUrl;

  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error) {
        // Attempt to parse a more specific error message from the response if available
        const message = (error as any).cause?.message || error.message;
        try {
          const parsedError = JSON.parse(message.substring(message.indexOf('{')));
          const finalMessage = parsedError.error.message;
          throw new Error(`Video generation failed: ${finalMessage}`);
        } catch(parseError) {
           throw new Error(`Video generation failed: ${message}`);
        }
    }
    throw new Error("An unknown error occurred during video generation.");
  }
};
