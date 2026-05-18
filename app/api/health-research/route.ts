import { getJson } from "serpapi";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, medicalContext } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Initialize SerpApi search
    const apiKey = process.env.SERPAPI_API_KEY || "fb3cd784e9089222a009187a55f866635848bb2909438fa73295c55676ee5256";

    // We add clinical context to the search query if available
    const contextString = medicalContext
      ? `Patient Clinical Context: ${JSON.stringify(medicalContext)}`
      : "";

    // Perform the search using SerpApi (Google Search Engine)
    const searchResponse = await getJson({
      engine: "google",
      q: `${query} medical research`,
      api_key: apiKey,
    });

    const searchResults = searchResponse.organic_results?.slice(0, 5) || [];
    const snippets = searchResults.map((r: any) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet
    }));

    // 2. Use Gemini to synthesize the search results into a professional report
    const prompt = `
      You are 'Hilium Health Research AI', a specialist in synthesizing complex medical research into actionable clinical intelligence for patients.
      
      USER RESEARCH GOAL: "${query}"
      PATIENT CLINICAL CONTEXT: ${contextString}
      
      RAW RESEARCH DATA (SerpApi Search Results):
      ${JSON.stringify(snippets, null, 2)}
      
      TASK:
      Synthesize the above research results into a clear, patient-friendly report. 
      The report MUST be written in PLAIN ENGLISH that a non-medical person can easily understand. Avoid excessive technical jargon or "decrypted" data styles.
      
      Structure the report with the following sections:
      
      ### 🔬 Clinical Overview
      Summarize the most relevant medical findings in simple terms. What does the latest research say about "${query}"?
      
      ### 🧬 Relation to Your Health
      How does this research possibly connect to your medical history or current vitals? Use simple comparisons.
      
      ### 📋 Suggested Next Steps
      List 3 clear points to discuss with your doctor.
      
      ### ⚠️ Important Notice
      A simple disclaimer that this is for informational purposes only.
      
      STYLE GUIDELINES:
      - Use CLEAR, USER-READABLE PLAIN ENGLISH.
      - DO NOT use difficult-to-comprehend clinical shorthand.
      - Use Markdown to highlight the most important points.
      - Be direct and helpful.
    `;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    return NextResponse.json({
      report: text,
      sources: snippets.map((r: any) => ({ title: r.title, url: r.link }))
    });

  } catch (error: any) {
    console.error("Health Research Error:", error);
    return NextResponse.json({ error: "Failed to perform health research" }, { status: 500 });
  }
}
