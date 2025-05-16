
const router = require('express').Router();
router.post('/', async (req, res) => {
  const { lat, lon, neighbourhood, city } = req.body;
  console.log('Received from client:', lat, lon, neighbourhood, city);

  // Use neighbourhood directly if sent, or reverse geocode lat/lon on server
  const userLocation = neighbourhood + ', ' + city || 'your area';
    console.log('User location:', userLocation);

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `3 to 7 cool things I can do around ${userLocation}? No follow up questions, just a numbered list (1-5) of things I can do and a title with no number. One item per line. No extra text.`
        }
      ],
      model: "deepseek-chat",
      temperature: 0.9
    });

    const reply = completion.choices[0].message.content;
    res.json({ message: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

module.exports = router;