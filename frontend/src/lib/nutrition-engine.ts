/** BMR & TDEE Calculation Engine — Mifflin-St Jeor Formula */

const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
    fat_loss: -500, muscle_gain: 300, lean_body: -250, good_physique: -200, maintenance: 0,
};

const getActivityLevel = (jobType: string, workoutFrequency: number) => {
    if (jobType === 'sedentary' && workoutFrequency <= 1) return 'sedentary';
    if (jobType === 'sedentary' && workoutFrequency <= 3) return 'light';
    if (jobType === 'moderate' && workoutFrequency <= 3) return 'moderate';
    if (workoutFrequency >= 6) return 'very_active';
    if (workoutFrequency >= 4) return 'active';
    return 'moderate';
};

const calculateMacros = (targetCalories: number, weight: number, goal: string) => {
    let proteinPerKg: number;
    let fatPercent: number;
    switch (goal) {
        case 'muscle_gain': proteinPerKg = 2.2; fatPercent = 0.25; break;
        case 'fat_loss': proteinPerKg = 2.0; fatPercent = 0.28; break;
        case 'lean_body': proteinPerKg = 1.8; fatPercent = 0.28; break;
        case 'good_physique': proteinPerKg = 1.6; fatPercent = 0.30; break;
        default: proteinPerKg = 1.4; fatPercent = 0.30;
    }
    const proteinG = Math.round(weight * proteinPerKg);
    const fatG = Math.round((targetCalories * fatPercent) / 9);
    const carbsG = Math.max(0, Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4));
    return { protein: proteinG, carbs: carbsG, fat: fatG };
};

export const calculateNutrition = ({ age, gender, height_cm, weight_kg, job_type, workout_frequency, goal }: {
    age: number; gender: string; height_cm: number; weight_kg: number;
    job_type: string; workout_frequency: number; goal: string;
}) => {
    const bmr = calculateBMR(weight_kg, height_cm, age, gender);
    const activityLevel = getActivityLevel(job_type, workout_frequency);
    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.375));
    const targetCalories = Math.max(1200, tdee + (GOAL_ADJUSTMENTS[goal] || 0));
    const macros = calculateMacros(targetCalories, weight_kg, goal);
    return {
        bmr: Math.round(bmr), tdee, activityLevel,
        targetCalories: Math.round(targetCalories),
        targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat,
    };
};

export const generateNutritionTips = (goal: string, dietaryPreference?: string): string[] => {
    const general = [
        'Drink at least 8-10 glasses of water daily for optimal metabolism.',
        'Eat slowly and mindfully — it takes 20 minutes for fullness to register.',
        'Never skip breakfast — it kickstarts your metabolism.',
        'Aim for 7-8 hours of sleep for muscle recovery and hormone balance.',
        'Eat colorful vegetables for essential micronutrients and antioxidants.',
    ];
    const goalTips: Record<string, string[]> = {
        fat_loss: ['Eat protein with every meal to stay full and preserve muscle.', 'Avoid liquid calories.', 'Do not cut more than 500 kcal/day.'],
        muscle_gain: ['Consume protein within 30-60 mins post-workout.', 'Track calories to ensure a consistent surplus.', 'Creatine monohydrate is the most evidence-backed supplement.'],
        lean_body: ['Focus on body recomposition — build muscle while losing fat.', 'HIIT works great for a lean physique.'],
        good_physique: ['Consistency is key — stick to your plan 80% of the time.', 'Progress photos every 2 weeks beat daily weigh-ins.'],
        maintenance: ['Flexible dieting (IIFYM) works for long-term maintenance.', 'Re-evaluate your TDEE every 8-12 weeks.'],
    };
    return [...general, ...(goalTips[goal] || [])].slice(0, 6);
};

export const generateWeeklyMealPlan = (
    nutrition: { targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number },
    goal: string,
    dietaryPreference = 'none',
) => {
    const isVeg = dietaryPreference === 'vegetarian' || dietaryPreference === 'vegan';

    const breakfasts = isVeg ? [
        { name: 'Oats with Banana & Nuts', calories: 380, protein: 12, carbs: 65, fat: 10, description: '1 cup oats, 1 banana, 10 almonds, 1 tbsp honey' },
        { name: 'Idli Sambar (4 pieces)', calories: 280, protein: 10, carbs: 48, fat: 3, description: '4 idlis with sambar and coconut chutney' },
        { name: 'Whole Wheat Toast with Peanut Butter', calories: 320, protein: 14, carbs: 38, fat: 12, description: '2 slices whole wheat bread, 2 tbsp peanut butter, 1 banana' },
        { name: 'Greek Yogurt Parfait', calories: 340, protein: 20, carbs: 42, fat: 8, description: '200g Greek yogurt, mixed berries, granola, honey' },
        { name: 'Moong Dal Chilla', calories: 290, protein: 17, carbs: 38, fat: 6, description: '3 moong dal chilla with mint chutney' },
        { name: 'Vegetable Poha', calories: 260, protein: 8, carbs: 45, fat: 5, description: 'Flattened rice with veggies, peanuts, spices' },
        { name: 'Paneer Bhurji with Chapati', calories: 410, protein: 22, carbs: 38, fat: 14, description: '100g paneer bhurji, 2 whole wheat chapatis' },
    ] : [
        { name: 'Scrambled Eggs & Whole Wheat Toast', calories: 380, protein: 24, carbs: 32, fat: 14, description: '3 eggs, 2 slices whole wheat toast, 1 tsp butter' },
        { name: 'Oats with Protein & Fruits', calories: 400, protein: 28, carbs: 50, fat: 8, description: '1 cup oats, 1 scoop whey, banana, berries' },
        { name: 'Boiled Eggs & Idli', calories: 320, protein: 22, carbs: 35, fat: 9, description: '3 boiled eggs, 2 idli with sambar' },
        { name: 'Chicken Omelette', calories: 360, protein: 35, carbs: 8, fat: 16, description: '3 eggs, 50g chicken, veggies, olive oil' },
        { name: 'Greek Yogurt with Eggs & Fruit', calories: 340, protein: 28, carbs: 30, fat: 10, description: '150g Greek yogurt, 2 boiled eggs, apple' },
        { name: 'Egg Bhurji with Chapati', calories: 390, protein: 26, carbs: 40, fat: 12, description: '3 egg bhurji, 2 whole wheat chapatis' },
        { name: 'Protein Smoothie', calories: 350, protein: 30, carbs: 42, fat: 6, description: '1 scoop whey, 1 banana, milk, oats, peanut butter' },
    ];

    const lunches = isVeg ? [
        { name: 'Dal Rice with Veggies', calories: 480, protein: 18, carbs: 72, fat: 8, description: '1 cup dal, 1 cup brown rice, mixed vegetables, salad' },
        { name: 'Rajma Chawal', calories: 520, protein: 22, carbs: 78, fat: 8, description: '1.5 cups rajma curry, 1 cup rice, raita' },
        { name: 'Paneer Tikka with Roti', calories: 540, protein: 28, carbs: 52, fat: 18, description: '150g paneer tikka, 3 rotis, salad' },
        { name: 'Chickpea Salad Bowl', calories: 420, protein: 20, carbs: 55, fat: 10, description: 'Chickpeas, cucumber, tomato, onion, olive oil dressing' },
        { name: 'Palak Paneer with Brown Rice', calories: 510, protein: 24, carbs: 56, fat: 16, description: 'Palak paneer, 1 cup brown rice, raita' },
        { name: 'Mixed Dal Khichdi', calories: 440, protein: 16, carbs: 68, fat: 6, description: 'Dal, rice khichdi with veggies, ghee, papad' },
        { name: 'Tofu Stir Fry with Rice', calories: 460, protein: 22, carbs: 60, fat: 12, description: '200g tofu, vegetables, soy sauce, 1 cup rice' },
    ] : [
        { name: 'Grilled Chicken with Rice & Veggies', calories: 520, protein: 45, carbs: 48, fat: 10, description: '200g chicken breast, 1 cup rice, mixed veggies' },
        { name: 'Tuna Salad with Quinoa', calories: 450, protein: 42, carbs: 38, fat: 12, description: '150g tuna, quinoa, cucumber, tomato, olive oil' },
        { name: 'Chicken Dal Rice', calories: 560, protein: 48, carbs: 55, fat: 10, description: '150g chicken curry, dal, 1 cup brown rice' },
        { name: 'Salmon with Sweet Potato', calories: 500, protein: 40, carbs: 42, fat: 16, description: '180g grilled salmon, sweet potato, broccoli' },
        { name: 'Egg Fried Rice', calories: 480, protein: 22, carbs: 62, fat: 12, description: '3 eggs, 1.5 cups rice, vegetables, soy sauce' },
        { name: 'Chicken Wrap', calories: 520, protein: 40, carbs: 48, fat: 14, description: 'Whole wheat wrap, grilled chicken, veggies, hummus' },
        { name: 'Fish Curry with Rice', calories: 510, protein: 38, carbs: 52, fat: 14, description: '200g fish curry, 1 cup rice, salad' },
    ];

    const dinners = isVeg ? [
        { name: 'Palak Dal with Roti', calories: 380, protein: 16, carbs: 52, fat: 8, description: '1 cup palak dal, 2 whole wheat rotis' },
        { name: 'Vegetable Soup & Bread', calories: 320, protein: 10, carbs: 48, fat: 7, description: 'Mixed vegetable soup, 2 slices whole wheat bread' },
        { name: 'Tofu & Vegetable Stir Fry', calories: 340, protein: 18, carbs: 28, fat: 14, description: '200g tofu, bell peppers, broccoli, soy sauce' },
        { name: 'Moong Dal Khichdi', calories: 350, protein: 14, carbs: 58, fat: 6, description: 'Light moong dal khichdi with ghee' },
        { name: 'Mixed Vegetable Curry with Roti', calories: 360, protein: 12, carbs: 52, fat: 10, description: 'Seasonal vegetables curry, 2 rotis' },
        { name: 'Lentil Soup with Quinoa', calories: 370, protein: 18, carbs: 54, fat: 6, description: 'Red lentil soup, quinoa, bread' },
        { name: 'Paneer Salad Bowl', calories: 380, protein: 20, carbs: 22, fat: 18, description: '150g paneer, cucumber, tomato, leafy greens, vinaigrette' },
    ] : [
        { name: 'Grilled Chicken with Salad', calories: 380, protein: 42, carbs: 18, fat: 12, description: '180g grilled chicken, mixed greens, olive oil dressing' },
        { name: 'Baked Salmon with Veggies', calories: 400, protein: 38, carbs: 20, fat: 18, description: '180g salmon, roasted vegetables, lemon' },
        { name: 'Egg White Omelette with Vegetables', calories: 250, protein: 28, carbs: 12, fat: 8, description: '5 egg whites, mixed veggies, feta cheese' },
        { name: 'Chicken Soup with Bread', calories: 360, protein: 36, carbs: 28, fat: 8, description: 'Homemade chicken soup, 1 slice whole wheat bread' },
        { name: 'Tuna with Avocado Salad', calories: 380, protein: 34, carbs: 16, fat: 18, description: '150g tuna, avocado, cucumber, tomato, lemon dressing' },
        { name: 'Chicken & Vegetable Stir Fry', calories: 390, protein: 40, carbs: 22, fat: 14, description: '200g chicken, mixed vegetables, soy sauce' },
        { name: 'Grilled Fish with Steamed Veggies', calories: 350, protein: 36, carbs: 18, fat: 12, description: '200g grilled fish, steamed broccoli, carrot, beans' },
    ];

    const snacks = isVeg ? [
        { name: 'Almonds & Walnuts', calories: 180, protein: 5, carbs: 6, fat: 16, description: '15 almonds, 5 walnuts' },
        { name: 'Banana with Peanut Butter', calories: 200, protein: 6, carbs: 32, fat: 8, description: '1 banana, 1 tbsp peanut butter' },
        { name: 'Greek Yogurt with Berries', calories: 160, protein: 14, carbs: 18, fat: 2, description: '150g Greek yogurt, mixed berries' },
        { name: 'Fruit & Nut Mix', calories: 170, protein: 4, carbs: 22, fat: 8, description: 'Mixed dried fruits and nuts' },
        { name: 'Protein Smoothie', calories: 220, protein: 20, carbs: 28, fat: 4, description: 'Whey protein, milk, banana, honey' },
        { name: 'Hummus with Veggies', calories: 180, protein: 8, carbs: 20, fat: 9, description: '3 tbsp hummus, carrot sticks, cucumber' },
        { name: 'Roasted Chana', calories: 160, protein: 10, carbs: 26, fat: 3, description: 'Spiced roasted chickpeas' },
    ] : [
        { name: 'Boiled Eggs & Nuts', calories: 200, protein: 16, carbs: 4, fat: 14, description: '2 boiled eggs, 10 almonds' },
        { name: 'Cottage Cheese & Fruits', calories: 180, protein: 18, carbs: 20, fat: 4, description: '100g cottage cheese, apple, honey' },
        { name: 'Protein Shake', calories: 200, protein: 24, carbs: 12, fat: 4, description: '1 scoop whey, 250ml milk' },
        { name: 'Tuna on Crackers', calories: 190, protein: 20, carbs: 16, fat: 5, description: '80g tuna, 4 whole grain crackers' },
        { name: 'Greek Yogurt with Berries', calories: 160, protein: 14, carbs: 18, fat: 2, description: '150g Greek yogurt, mixed berries' },
        { name: 'Banana & Peanut Butter', calories: 200, protein: 7, carbs: 32, fat: 8, description: '1 banana, 1 tbsp peanut butter' },
        { name: 'Chicken & Veggie Wrap Snack', calories: 220, protein: 20, carbs: 22, fat: 6, description: 'Small whole wheat wrap with chicken, veggies' },
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyPlan = days.map((day, i) => {
        const b = breakfasts[i % 7], l = lunches[i % 7], d = dinners[i % 7], s = snacks[i % 7];
        return {
            day,
            meals: { breakfast: b, lunch: l, dinner: d, snack: s },
            dayTotals: {
                calories: b.calories + l.calories + d.calories + s.calories,
                protein: b.protein + l.protein + d.protein + s.protein,
                carbs: b.carbs + l.carbs + d.carbs + s.carbs,
                fat: b.fat + l.fat + d.fat + s.fat,
            },
        };
    });

    return {
        ...nutrition,
        weeklyPlan,
        generatedAt: new Date().toISOString(),
        tips: generateNutritionTips(goal, dietaryPreference),
    };
};
