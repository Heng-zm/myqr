'use server';
/**
 * @fileOverview An AI flow to analyze the content of a QR code or barcode.
 *
 * - analyzeCode - A function that handles the code analysis.
 * - AnalyzeCodeInput - The input type for the analyzeCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodeInputSchema = z.object({
  content: z.string().describe('The content of the QR code or barcode.'),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.object({
  contentType: z.string().describe("Categorize the content type (e.g., 'URL', 'Product Barcode', 'Text', 'Unknown')."),
  riskAssessment: z.string().describe("Assess the potential risk of the content (e.g., 'Low Risk', 'Medium Risk', 'High Risk', 'Unknown'). Provide a brief justification."),
  summary: z.string().describe('A concise, one-sentence summary of what the user can expect from this content.'),
});
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeCode(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  return analyzeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `You are a security and product expert specializing in analyzing content from QR codes and barcodes. Analyze the following content and provide an assessment.

Content: {{{content}}}

If the content is a URL:
1.  **Content Type**: Categorize it as 'URL' and specify the type (e.g., 'Official Website', 'Social Media', 'Shopping Link').
2.  **Risk Assessment**: Assess the potential risk. If it looks like a standard, well-known domain, it's 'Low Risk'. If it's a URL shortener, or looks suspicious, flag it as 'Medium Risk' or 'High Risk'.
3.  **Summary**: Briefly describe the likely content or purpose of the page.

If the content is a numerical string, assume it's a product barcode (like a UPC or EAN):
1.  **Content Type**: Categorize it as 'Product Barcode'.
2.  **Risk Assessment**: State 'Low Risk'.
3.  **Summary**: Provide a brief, generic description of the type of product this barcode might represent (e.g., "This is likely a barcode for a grocery item."). Do not try to look up the exact product.

For any other type of text:
1.  **Content Type**: Categorize as 'Text'.
2.  **Risk Assessment**: State 'Low Risk'.
3.  **Summary**: Briefly describe the text content.
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
