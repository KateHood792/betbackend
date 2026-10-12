const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-real-code', async (req,res)=>{
  try{
    const { games } = req.body; // games from your AI
    // For now, create a booking session on SportyBet
    // SportyBet booking needs real event IDs, so we search them
    let selections = [];
    for(let g of games.slice(0,4)){
      try{
        const search = await axios.get(`https://www.sportybet.com/api/ng/search/events?q=${encodeURIComponent(g.home)}`);
        const event = search.data?.data?.events?.[0];
        if(event){
          const market = event.markets[0];
          selections.push({
            eventId: event.eventId,
            marketId: market.marketId,
            outcomeId: market.outcomes[0].outcomeId
          });
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,400));
    }

    if(selections.length===0){
      // Fallback if blocked - return demo but tell user
      return res.json({ success:false, error:'SportyBet blocked auto-booking (need proxy). Use manual method.' });
    }

    const booking = await axios.post('https://www.sportybet.com/api/ng/orders/bookings', 
      { selections },
      { headers:{ 'User-Agent':'Mozilla/5.0', 'Referer':'https://www.sportybet.com/ng/' }}
    );

    const realCode = booking.data?.data?.shareCode || booking.data?.shareCode;
    res.json({ success:true, realCode, link:`https://www.sportybet.com/ng/share/${realCode}` });

  }catch(e){
    res.json({ success:false, error:e.message, tip:'SportyBet anti-bot active. Deploy backend with proxy or use manual booking link method.' });
  }
});

app.get('/', (req,res)=>res.send('Backend LIVE - POST /api/create-real-code'));

app.listen(10000, ()=>console.log('Running on 10000'));