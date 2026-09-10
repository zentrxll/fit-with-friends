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

  /* ============================================================
     Food Suggestions
     ------------------------------------------------------------
     A small static database of example foods per BMI category,
     with approximate nutrition values per serving. Figures are
     rough estimates for illustration — swap in a real nutrition
     API or your own verified data for production use.
     ============================================================ */
  const foodDatabase = {
    0: [ // Underweight — higher calorie, protein-rich
      { name:'Peanut Butter Banana Smoothie', desc:'Blended with whole milk and oats for extra calories and protein.', kcal:420, protein:16, carbs:52, sugar:28, fat:16 },
      { name:'Grilled Chicken & Rice Bowl', desc:'Chicken thigh, jasmine rice, and olive oil for steady energy.', kcal:560, protein:38, carbs:60, sugar:2, fat:18 },
      { name:'Avocado Toast with Egg', desc:'Whole-grain toast, mashed avocado, and a fried egg.', kcal:390, protein:15, carbs:32, sugar:3, fat:24 }
    ],
    1: [ // Normal — balanced, maintenance
      { name:'Grilled Salmon with Quinoa', desc:'Omega-3 rich salmon with quinoa and steamed greens.', kcal:480, protein:34, carbs:38, sugar:3, fat:20 },
      { name:'Greek Yogurt with Berries', desc:'Plain yogurt, mixed berries, and a drizzle of honey.', kcal:220, protein:18, carbs:26, sugar:18, fat:5 },
      { name:'Tofu & Vegetable Stir-fry', desc:'Tofu, mixed vegetables, and brown rice, lightly seasoned.', kcal:410, protein:22, carbs:48, sugar:6, fat:12 }
    ],
    2: [ // Overweight — leaner, higher fiber
      { name:'Grilled Chicken Salad', desc:'Mixed greens, grilled chicken breast, and light vinaigrette.', kcal:320, protein:32, carbs:14, sugar:5, fat:14 },
      { name:'Steamed Fish with Broccoli', desc:'White fish fillet steamed with broccoli and lemon.', kcal:290, protein:30, carbs:10, sugar:2, fat:10 },
      { name:'Lentil & Vegetable Soup', desc:'Fiber-rich lentils simmered with tomato and vegetables.', kcal:260, protein:16, carbs:36, sugar:6, fat:4 }
    ],
    3: [ // Obese — low calorie, low sugar/fat, high fiber
      { name:'Steamed Vegetables with Tofu', desc:'Light steamed vegetables with plain tofu, no oil.', kcal:210, protein:14, carbs:20, sugar:4, fat:6 },
      { name:'Clear Vegetable Soup', desc:'Broth-based soup with mixed vegetables, minimal sodium.', kcal:140, protein:6, carbs:18, sugar:5, fat:2 },
      { name:'Grilled Fish with Leafy Greens', desc:'Lean white fish with a large side of leafy greens.', kcal:250, protein:28, carbs:8, sugar:2, fat:9 }
    ]
  };

  function renderFoodSuggestions(idx){
    const grid = document.getElementById('foodGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const foods = foodDatabase[idx] || [];
    foods.forEach(food => {
      const card = document.createElement('div');
      card.className = 'food-card';
      card.innerHTML = `
        <div class="food-card-top">
          <span class="food-name">${food.name}</span>
          <span class="food-kcal">${food.kcal} kcal</span>
        </div>
        <p class="food-desc">${food.desc}</p>
        <div class="food-nutrients">
          <span class="nutrient-tag">Protein <span class="val">${food.protein}g</span></span>
          <span class="nutrient-tag">Carbs <span class="val">${food.carbs}g</span></span>
          <span class="nutrient-tag">Sugar <span class="val">${food.sugar}g</span></span>
          <span class="nutrient-tag">Fat <span class="val">${food.fat}g</span></span>
        </div>
      `;
      grid.appendChild(card);
    });
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

    renderFoodSuggestions(info.idx);

    result.classList.add('show');
    result.scrollIntoView({behavior:'smooth', block:'nearest'});
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