
'use server';
/**
 * @fileOverview An AI flow to generate a styled, artistic QR code.
 *
 * - generateStyledQr - A function that handles styled QR code generation.
 * - GenerateStyledQrInput - The input type for the generateStyledQr function.
 * - GenerateStyledQrOutput - The return type for the generateStyledQr function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStyledQrInputSchema = z.object({
  content: z.string().describe('The content to be embedded in the QR code (e.g., a URL).'),
  stylePrompt: z.string().describe('A descriptive prompt for the visual style of the QR code (e.g., "vintage floral pattern", "steampunk gears").'),
});
export type GenerateStyledQrInput = z.infer<typeof GenerateStyledQrInputSchema>;

const GenerateStyledQrOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated styled QR code image. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateStyledQrOutput = z.infer<typeof GenerateStyledQrOutputSchema>;

export async function generateStyledQr(input: GenerateStyledQrInput): Promise<GenerateStyledQrOutput> {
  return generateStyledQrFlow(input);
}

const generateStyledQrFlow = ai.defineFlow(
  {
    name: 'generateStyledQrFlow',
    inputSchema: GenerateStyledQrInputSchema,
    outputSchema: GenerateStyledQrOutputSchema,
  },
  async ({ content, stylePrompt }) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a visually stunning, artistic, and creative QR code.
- The QR code must be perfectly scannable and must contain the following exact data: "${content}"
- The visual style of the QR code should be inspired by the following theme: "${stylePrompt}"
- The final image should be square. The QR code should be the main subject of the image, integrated beautifully into the art style.
- Do not include any text in the image.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Styled QR code generation failed.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
