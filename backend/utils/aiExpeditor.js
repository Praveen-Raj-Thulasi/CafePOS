const Groq = require('groq-sdk');
const Order = require('../models/Order');

// Graceful fallback if no API key is provided
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_crash' });

const prioritizeQueue = async (orders) => {
  if (!process.env.GROQ_API_KEY) {
    console.log('No GROQ_API_KEY found, skipping AI prioritization.');
    return null;
  }

  try {
    const prompt = `
      You are an expert Kitchen Expeditor. You are given a list of kitchen tickets currently pending.
      Your job is to analyze them and assign a priority score from 1-100 to each ticket.
      100 means highest priority (serve immediately), 1 means lowest priority.
      Consider:
      - Wait time (longer wait = higher priority)
      - Complexity (complex items might need to start sooner)
      - Size (small, quick orders might be knocked out fast to free up space)
      
      Output your response as pure JSON matching this exact structure:
      {
        "results": [
          { "orderId": "the_order_id_string", "aiPriorityScore": 95, "aiReasoning": "Short explanation" }
        ]
      }

      Here are the current tickets:
      ${JSON.stringify(orders.map(o => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        items: o.items,
        minutesWaiting: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
      })))}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    
    if (aiResponse.results && Array.isArray(aiResponse.results)) {
      // Bulk update the database
      const bulkOps = aiResponse.results.map(res => ({
        updateOne: {
          filter: { _id: res.orderId },
          update: { 
            aiPriorityScore: res.aiPriorityScore,
            aiReasoning: res.aiReasoning
          }
        }
      }));
      
      if (bulkOps.length > 0) {
        await Order.bulkWrite(bulkOps);
        console.log('Successfully updated AI Priorities in DB');
      }
    }
    
    return aiResponse.results;
  } catch (error) {
    console.error('Error with Groq AI Expeditor:', error);
    return null;
  }
};

module.exports = { prioritizeQueue };
