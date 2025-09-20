import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, userId, locationId = "all", timeRange = "1" } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query is required and must be a string" });
    }

    console.log(`[API] AI Query Request: ${req.method} ${req.url}`);
    console.log(`[API] Query: "${query.substring(0, 100)}..."`);
    console.log(`[API] Params - Location: ${locationId}, TimeRange: ${timeRange}, User: ${userId || 'anonymous'}`);

    // Mock AI response based on query content
    let response = "";
    let queryType = "general";
    let confidence = 0.8;
    let recommendations: string[] = [];
    let keyMetrics: Record<string, any> = {};

    // Simple keyword-based response generation
    const queryLower = query.toLowerCase();

    if (queryLower.includes("revenue") || queryLower.includes("income") || queryLower.includes("money")) {
      queryType = "revenue";
      response = `Based on the latest data for ${locationId === "all" ? "all locations" : locationId}, your practice shows strong revenue performance. Medical procedures account for 65.2% of total revenue, with cosmetic procedures contributing 26.1%. The refractive surgery segment represents 8.7% of revenue. Overall revenue has increased by 8.5% compared to the previous period.`;
      keyMetrics = {
        totalRevenue: 3760000,
        medicalRevenue: 2450000,
        cosmeticRevenue: 980000,
        refractiveRevenue: 330000
      };
      recommendations = [
        "Consider expanding cosmetic procedure offerings",
        "Focus on high-value medical procedures",
        "Evaluate refractive surgery marketing strategies"
      ];
    } else if (queryLower.includes("patient") || queryLower.includes("volume") || queryLower.includes("appointment")) {
      queryType = "patient_volume";
      response = `Patient volume analysis for ${locationId === "all" ? "all locations" : locationId} shows consistent growth. The practice is seeing an average of 150-200 patients per week across all locations. New patient acquisition has increased by 12% this quarter, while patient retention remains strong at 85%.`;
      keyMetrics = {
        weeklyPatients: 175,
        newPatients: 45,
        retentionRate: 0.85,
        avgAppointmentValue: 450
      };
      recommendations = [
        "Implement patient referral program",
        "Optimize appointment scheduling",
        "Focus on patient experience improvements"
      ];
    } else if (queryLower.includes("insurance") || queryLower.includes("claim") || queryLower.includes("payer")) {
      queryType = "insurance";
      response = `Insurance claims analysis for ${locationId === "all" ? "all locations" : locationId} shows that Medicare accounts for 35% of claims, followed by Blue Cross Blue Shield at 25%, and Aetna at 20%. Average AR days are 45 days, with 85% of claims paid within 60 days. Denial rate is currently at 8%, which is within industry standards.`;
      keyMetrics = {
        medicareClaims: 35,
        bcbsClaims: 25,
        aetnaClaims: 20,
        avgARDays: 45,
        denialRate: 0.08
      };
      recommendations = [
        "Streamline claims submission process",
        "Implement pre-authorization checks",
        "Focus on reducing denial rates"
      ];
    } else if (queryLower.includes("procedure") || queryLower.includes("surgery") || queryLower.includes("treatment")) {
      queryType = "procedures";
      response = `Procedure analysis for ${locationId === "all" ? "all locations" : locationId} shows that cataract surgery is the top revenue generator, followed by LASIK procedures and cosmetic treatments. The practice performs an average of 25 cataract surgeries per month, with excellent outcomes and high patient satisfaction.`;
      keyMetrics = {
        cataractSurgeries: 25,
        lasikProcedures: 15,
        cosmeticTreatments: 30,
        avgProcedureValue: 2500
      };
      recommendations = [
        "Expand cataract surgery capacity",
        "Promote LASIK procedure benefits",
        "Develop cosmetic treatment packages"
      ];
    } else {
      queryType = "general";
      response = `Thank you for your question about "${query}". Based on the current data for ${locationId === "all" ? "all locations" : locationId}, I can provide insights on revenue trends, patient volume, insurance claims, and procedure performance. Could you please be more specific about what aspect of the practice you'd like to analyze?`;
      recommendations = [
        "Ask about specific revenue metrics",
        "Inquire about patient volume trends",
        "Request insurance claims analysis",
        "Get procedure performance data"
      ];
    }

    const aiResponse = {
      response,
      queryType,
      confidence,
      locationContext: locationId,
      timeContext: timeRange,
      recommendations,
      keyMetrics,
      timestamp: new Date().toISOString()
    };

    console.log(`[API] AI Response generated: ${queryType} with confidence ${confidence}`);

    return res.status(200).json(aiResponse);

  } catch (error: any) {
    console.error('Error in AI query API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      response: "I apologize, but I'm experiencing technical difficulties. Please try your question again.",
      queryType: "error",
      confidence: 0,
      recommendations: [
        "Check your internet connection",
        "Try rephrasing your question",
        "Contact support if the issue persists"
      ],
      keyMetrics: {}
    });
  }
}

