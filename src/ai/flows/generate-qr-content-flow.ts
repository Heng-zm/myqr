
'use server';
/**
 * @fileOverview An AI flow to generate content for a QR code based on a topic.
 *
 * - generateQrContent - A function that handles the content generation.
 * - GenerateQrContentInput - The input type for the generateQrContent function.
 * - GenerateQrContentOutput - The return type for the generateQrContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQrContentInputSchema = z.object({
  topic: z.string().describe('The topic or idea for which to generate content. e.g., "a famous quote about programming", "a url for a cat video"'),
});
export type GenerateQrContentInput = z.infer<typeof GenerateQrContentInputSchema>;

const GenerateQrContentOutputSchema = z.object({
  content: z.string().describe("The generated content, which will be embedded in the QR code. This should be a concise string, like a URL, a quote, or a short message."),
});
export type GenerateQrContentOutput = z.infer<typeof GenerateQrContentOutputSchema>;

export async function generateQrContent(input: GenerateQrContentInput): Promise<GenerateQrContentOutput> {
  return generateQrContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQrContentPrompt',
  input: {schema: GenerateQrContentInputSchema},
  output: {schema: GenerateQrContentOutputSchema},
  prompt: `You are an expert content creator for QR codes. Your task is to generate a concise piece of text content based on the user's topic.

The content should be short and suitable for a QR code.

- If the topic suggests a URL (like "a funny cat video"), provide a plausible example URL.
- If the topic asks for a quote, find a relevant, short quote.
- For any other topic, generate a brief, interesting, or useful piece of text.

Topic: {{{topic}}}
`,
});

const generateQrContentFlow = ai.defineFlow(
  {
    name: 'generateQrContentFlow',
    inputSchema: GenerateQrContentInputSchema,
    outputSchema: GenerateQrContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
