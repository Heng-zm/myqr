'use server';
/**
 * @fileOverview An AI flow to analyze the content of a QR code.
 *
 * - analyzeCode - A function that handles the code analysis.
 * - AnalyzeCodeInput - The input type for the analyzeCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodeInputSchema = z.object({
  content: z.string().describe('The content of the QR code, which is usually a URL.'),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.object({
  urlType: z.string().describe("Categorize the URL type (e.g., 'Official Website', 'Social Media', 'Shopping Link', 'Unknown')."),
  riskAssessment: z.string().describe("Assess the potential risk of the URL (e.g., 'Low Risk', 'Medium Risk', 'High Risk', 'Unknown'). Provide a brief justification."),
  summary: z.string().describe('A concise, one-sentence summary of what the user can expect if they visit this URL.'),
});
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeCode(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  return analyzeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `You are a security expert specializing in URL analysis. Analyze the following URL and provide a security assessment.

URL: {{{content}}}

Based on the URL, provide the following information:
1.  **URL Type**: Categorize the URL.
2.  **Risk Assessment**: Assess the potential risk. If it looks like a standard, well-known domain, it's 'Low Risk'. If it's a URL shortener, or looks suspicious, flag it as 'Medium Risk' or 'High Risk'.
3.  **Summary**: Briefly describe the likely content or purpose of the page.
`,
});

const analyzeCodeFlow = ai.defineFlow(
  {
    name: 'analyzeCodeFlow',
    inputSchema: AnalyzeCodeInputSchema,
    outputSchema: AnalyzeCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
