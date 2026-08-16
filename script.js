const btn = document.getElementById('calcBtn');
  const result = document.getElementById('result');

  function classify(bmi){
    if (bmi < 18.5) return {tag:'Underweight', cls:'warn', idx:0};
    if (bmi < 25)   return {tag:'Normal', cls:'', idx:1};
    if (bmi < 30)   return {tag:'Overweight', cls:'warn', idx:2};
    return {tag:'Obese', cls:'alert', idx:3};
  }

  function markerPosition(bmi){
    // scale: <18.5 (0-20%) | 18.5-25 (20-45%) | 25-30 (45-65%) | 30+ (65-100%), clamped
    const clamped = Math.max(12, Math.min(40, bmi));
    let pct;
    if (bmi < 18.5) pct = (bmi/18.5) * 20;
    else if (bmi < 25) pct = 20 + ((bmi-18.5)/(25-18.5)) * 25;
    else if (bmi < 30) pct = 45 + ((bmi-25)/(30-25)) * 20;
    else pct = 65 + Math.min(((bmi-30)/10) * 35, 35);
    return Math.max(1, Math.min(99, pct));
  }

  function adviceFor(idx, tdee){
    switch(idx){
      case 0: return `Your BMI is below the standard range. Try increasing your intake to around ${Math.round(tdee+300)} calories a day from nutritious food, paired with strength training to build muscle.`;
      case 1: return `Nice — your BMI is in the normal range. Keep your intake around ${Math.round(tdee)} calories a day to maintain your current weight, along with regular exercise.`;
      case 2: return `Your BMI is in the overweight range. Try a modest deficit of around ${Math.round(tdee-300)} calories a day, combined with aerobic activity for sustainable results.`;
      default: return `Your BMI is in the obese range. It's best to consult a doctor or dietitian, and consider gradually lowering your intake to around ${Math.round(tdee-500)} calories a day.`;
    }
  }

  btn.addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    const age = parseFloat(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activity = parseFloat(document.getElementById('activity').value);

    if (!weight || !heightCm || weight <= 0 || heightCm <= 0){
      alert('Please enter a valid weight and height.');
      return;
    }

    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const info = classify(bmi);

    document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    const tagEl = document.getElementById('bmiTag');
    tagEl.textContent = info.tag;
    tagEl.className = 'bmi-tag ' + info.cls;
    document.getElementById('bmiMarker').style.left = markerPosition(bmi) + '%';

    let bmr = null, tdee = null;
    if (age && age > 0){
      // Mifflin-St Jeor
      bmr = gender === 'male'
        ? (10*weight + 6.25*heightCm - 5*age + 5)
        : (10*weight + 6.25*heightCm - 5*age - 161);
      tdee = bmr * activity;
      document.getElementById('bmrValue').textContent = Math.round(bmr).toLocaleString();
      document.getElementById('tdeeValue').textContent = Math.round(tdee).toLocaleString();
      document.getElementById('adviceNote').textContent = adviceFor(info.idx, tdee);
    } else {
      document.getElementById('bmrValue').textContent = '—';
      document.getElementById('tdeeValue').textContent = '—';
      document.getElementById('adviceNote').textContent = 'Enter your "Age" to calculate a detailed daily calorie recommendation (only the BMI result is shown for now).';
    }

    result.classList.add('show');
    result.scrollIntoView({behavior:'smooth', block:'nearest'});
  });

  /* ============================================================
     AI Chat Widget
     ------------------------------------------------------------
     This is a FRONTEND-ONLY demo. There is no real AI connected
     yet — sendMessageToAI() below just echoes a canned reply.

     When you have a backend ready, replace the inside of
     sendMessageToAI() with a fetch() call to YOUR OWN server
     endpoint (never call the Anthropic/OpenAI API directly from
     this file — that would expose your secret API key to anyone
     who views the page source). Example:

     async function sendMessageToAI(userText) {
       const res = await fetch('/api/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: userText })
       });
       const data = await res.json();
       return data.reply;
     }
     ============================================================ */

  const chatToggle   = document.getElementById('chatToggle');
  const chatPanel     = document.getElementById('chatPanel');
  const chatClose     = document.getElementById('chatClose');
  const chatForm      = document.getElementById('chatForm');
  const chatInput     = document.getElementById('chatInput');
  const chatMessages  = document.getElementById('chatMessages');
  const chatTyping    = document.getElementById('chatTyping');

  function openChat(){
    chatPanel.classList.add('open');
    chatToggle.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatInput.focus();
  }

  function closeChat(){
    chatPanel.classList.remove('open');
    chatToggle.classList.remove('open');
    chatPanel.setAttribute('aria-hidden', 'true');
  }

  chatToggle.addEventListener('click', () => {
    chatPanel.classList.contains('open') ? closeChat() : openChat();
  });
  chatClose.addEventListener('click', closeChat);

  function addMessage(text, sender){
    const row = document.createElement('div');
    row.className = 'chat-msg ' + sender;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Placeholder "AI" — swap this out for a real backend call later.
  async function sendMessageToAI(userText){
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random()*500));
    return `(Demo reply) I heard: "${userText}" — connect a backend to get real AI answers here.`;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';
    chatInput.disabled = true;
    chatTyping.hidden = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try{
      const reply = await sendMessageToAI(text);
      addMessage(reply, 'bot');
    } catch(err){
      addMessage('Something went wrong. Please try again.', 'bot');
    } finally {
      chatTyping.hidden = true;
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  /* ============================================================
     Background Slideshow
     ------------------------------------------------------------
     Crossfades between the .bg-slide images inside .bg-slideshow.
     Change SLIDE_INTERVAL_MS to speed up/slow down the cycle.
     ============================================================ */
  const SLIDE_INTERVAL_MS = 6000;
  const slides = document.querySelectorAll('.bg-slide');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (slides.length > 1 && !prefersReducedMotion) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, SLIDE_INTERVAL_MS);
  }