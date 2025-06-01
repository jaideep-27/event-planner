// eventplanner/src/services/ai.ts

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.3-70b-versatile"; // As specified by user

export interface EventDetails {
  location: string;
  budget: number;
  guestCount: number;
  eventType: string;
  preferences: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeApiCallWithRetry = async (prompt: string, maxRetries: number = 3): Promise<string> => {
  let lastError;
  console.log("[ai.ts] makeApiCallWithRetry: Called with prompt (first 100 chars):", prompt.substring(0,100));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[ai.ts] makeApiCallWithRetry: Attempt ${attempt}/${maxRetries}`);
    try {
      const requestBody = {
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        // temperature: 0.7,
        // max_tokens: 1024,
      };
      console.log("[ai.ts] makeApiCallWithRetry: Request body to Groq:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
      console.log(`[ai.ts] makeApiCallWithRetry: Groq response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData = { message: response.statusText };
        try {
            errorData = await response.json();
            console.error("[ai.ts] makeApiCallWithRetry: Groq API error response JSON:", errorData);
        } catch (e) {
            console.error("[ai.ts] makeApiCallWithRetry: Groq API error response was not valid JSON.");
        }
        throw new Error(`Groq API Error: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("[ai.ts] makeApiCallWithRetry: Raw JSON data from Groq:", JSON.stringify(data, null, 2));

      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        const extractedContent = data.choices[0].message.content;
        console.log("[ai.ts] makeApiCallWithRetry: Successfully extracted content (first 200 chars):", extractedContent.substring(0,200));
        return extractedContent;
      } else {
        console.error("[ai.ts] makeApiCallWithRetry: Invalid response structure from Groq API. Full data:", data);
        throw new Error("Invalid response structure from Groq API");
      }

    } catch (error) {
      lastError = error;
      console.error(`[ai.ts] makeApiCallWithRetry: Attempt ${attempt} failed. Error:`, error);

      if (attempt < maxRetries) {
        const backoffTime = Math.min(Math.pow(2, attempt) * 1000, 8000);
        console.log(`[ai.ts] makeApiCallWithRetry: Waiting ${backoffTime}ms before next retry.`);
        await delay(backoffTime);
      }
    }
  }

  console.error("[ai.ts] makeApiCallWithRetry: All retries failed. Rethrowing last error:", lastError);
  throw lastError;
};

export const generateEventPlan = async (details: EventDetails): Promise<string> => {
  console.log("[ai.ts] generateEventPlan: Starting with details:", details);

  const prompt = `Create a detailed event plan for an Indian ${details.eventType} with the following details:
Location: ${details.location}
Budget: ${details.budget} INR
Number of guests: ${details.guestCount}
Additional preferences: ${details.preferences}

Please provide a structured plan with the following sections. Use plain text formatting without any markdown symbols:

1. Venue Suggestions
Consider the guest count and provide 2-3 venue options with their pros and cons.

2. Budget Breakdown
Provide a detailed breakdown of:
- Venue cost
- Catering cost per person
- Decoration
- Entertainment
- Other miscellaneous expenses

3. Menu Suggestions
Suggest a menu that includes:
- Welcome drinks
- Appetizers
- Main course
- Desserts
Consider any dietary preferences mentioned.

4. Decoration Ideas
Provide specific decoration themes and elements that match Indian aesthetics.

5. Timeline of Events
Create a detailed hour-by-hour schedule.

6. Additional Recommendations
Any special suggestions or considerations.

Important: Format the response in plain text without any markdown symbols or formatting characters. Strictly adhere to the section numbering and headings as specified above. Ensure the output is clean and ready for direct display.`;
  console.log("[ai.ts] generateEventPlan: Generated prompt (first 200 chars):", prompt.substring(0,200));

  try {
    console.log("[ai.ts] generateEventPlan: Calling makeApiCallWithRetry.");
    const text = await makeApiCallWithRetry(prompt);
    console.log("[ai.ts] generateEventPlan: Received text from makeApiCallWithRetry (first 200 chars):", text?.substring(0,200));

    if (!text || text.length < 100) {
      console.error("[ai.ts] generateEventPlan: Validation failed - Generated text is too short. Length:", text?.length);
      throw new Error("Generated plan is too short or empty");
    }
    console.log("[ai.ts] generateEventPlan: Text length validation passed.");

    const requiredSections = ["Venue Suggestions", "Budget Breakdown", "Menu Suggestions", "Decoration Ideas", "Timeline of Events", "Additional Recommendations"];
    const lowerCaseText = text.toLowerCase();
    let allSectionsPresent = true;
    const missingSections: string[] = [];
    requiredSections.forEach(section => {
      if (!lowerCaseText.includes(section.toLowerCase())) {
        allSectionsPresent = false;
        missingSections.push(section);
      }
    });

    if (!allSectionsPresent) {
      console.error("[ai.ts] generateEventPlan: Validation failed - Response is missing required sections. Missing:", missingSections.join(', '));
      console.error("[ai.ts] generateEventPlan: Full text for debugging missing sections:", text);
      throw new Error(`Generated plan is incomplete. Missing: ${missingSections.join(', ')}.`);
    }
    console.log("[ai.ts] generateEventPlan: All required sections present.");

    // Basic cleaning, can be made more robust if needed
    let cleanedText = text.replace(/\*\*/g, '')  // Remove bold
                         .replace(/\*/g, '')      // Remove italics/asterisks used for lists
                         .replace(/`/g, '')       // Remove code blocks
                         .replace(/#{1,6}\s/g, '') // Remove headers
                         .replace(/^\s*-\s/gm, '') // Remove leading hyphens from list items
                         .replace(/\n\s*\n/g, '\n\n'); // Normalize line breaks
    console.log("[ai.ts] generateEventPlan: Text after cleaning (first 200 chars):", cleanedText.substring(0,200));

    return cleanedText;

  } catch (error) {
    console.error("[ai.ts] generateEventPlan: Catch block. Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Authorization")) {
        throw new Error("Groq API Authorization Error. Please check your API key.");
      }
      if (error.message.includes("model_not_found")) { // Example, actual error might differ
        throw new Error(`Groq API Error: Model ${MODEL_NAME} not found.`);
      }
      // Keep the generic error for other cases from makeApiCallWithRetry or local validation errors
      throw error; // Re-throw the original error if it's already specific enough or not matched
    }
    // Fallback for non-Error objects thrown
    throw new Error("Failed to generate event plan using Groq API due to an unknown error.");
  }
};