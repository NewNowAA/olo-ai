
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
    if (!apiKey) {
      throw new Error("API Key GOOGLE_GENERATIVE_AI_API_KEY is missing!");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Listing models...");

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = "Non-JSON response";
    }

    if (response.ok) {
      console.log("SUCCESS: Models listed");
      return new Response(JSON.stringify({ success: true, models: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error(`FAILED: List Models - ${response.status}`);
      return new Response(JSON.stringify({ success: false, status: response.status, error: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("Test Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message, stack: error.stack }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
