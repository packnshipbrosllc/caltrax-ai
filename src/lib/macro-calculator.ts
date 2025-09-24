export interface ProfileData {
  height: number; // in inches
  weight: number; // in pounds
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
  goals: string[];
  dietaryRestrictions: string[];
}

export interface MacroGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const calculateCalories = (profileData: ProfileData): number => {
  const { height, weight, age, gender, activityLevel, goals } = profileData;
  
  if (!height || !weight || !age || !gender || !activityLevel) return 2000;

  // Convert height from inches to centimeters for BMR calculation
  const heightInCm = height * 2.54;
  const weightKg = weight * 0.453592; // Convert pounds to kg

  // BMR calculation (Mifflin-St Jeor Equation) - more conservative
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightInCm - 5 * age - 161;
  }

  // More conservative activity multipliers
  const multipliers = {
    sedentary: 1.2,
    light: 1.35,
    moderate: 1.5,
    very: 1.65,
    extreme: 1.8
  };

  const tdee = bmr * multipliers[activityLevel];
  
  // Apply realistic goal adjustments with safety limits
  let calorieGoal = tdee;
  
  if (goals.includes('lose_weight') || goals.includes('burn_fat')) {
    // Weight loss: 300-500 calorie deficit (0.5-1 lb per week)
    calorieGoal = Math.max(tdee - 400, bmr * 1.1); // Never go below 10% above BMR
  } else if (goals.includes('build_muscle') || goals.includes('gain_weight')) {
    // Weight gain: 200-400 calorie surplus (0.4-0.8 lb per week)
    calorieGoal = Math.min(tdee + 300, tdee * 1.15); // Never exceed 15% above TDEE
  }
  
  // Safety limits: 1200-4000 calories per day
  calorieGoal = Math.max(1200, Math.min(4000, calorieGoal));
  
  return Math.round(calorieGoal);
};

export const calculateMacros = (calories: number, profileData: ProfileData): MacroGoals => {
  const { goals, weight } = profileData;
  const weightKg = weight * 0.453592; // Convert pounds to kg
  
  // Calculate protein based on body weight (1-2g per kg, or 0.45-0.9g per lb)
  let proteinPerKg: number;
  if (goals.includes('build_muscle') || goals.includes('gain_weight')) {
    proteinPerKg = 2.0; // 2g per kg for muscle building
  } else if (goals.includes('burn_fat') || goals.includes('lose_weight')) {
    proteinPerKg = 1.8; // 1.8g per kg for fat loss (higher for satiety)
  } else {
    proteinPerKg = 1.6; // 1.6g per kg for maintenance
  }
  
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCalories = protein * 4;
  
  // Calculate fat (20-35% of calories)
  let fatPercentage: number;
  if (goals.includes('burn_fat') || goals.includes('lose_weight')) {
    fatPercentage = 0.25; // 25% for fat loss
  } else if (goals.includes('build_muscle')) {
    fatPercentage = 0.30; // 30% for muscle building
  } else {
    fatPercentage = 0.30; // 30% for maintenance
  }
  
  const fatCalories = calories * fatPercentage;
  const fat = Math.round(fatCalories / 9); // 9 cal/g
  
  // Remaining calories go to carbs
  const remainingCalories = calories - proteinCalories - fatCalories;
  const carbs = Math.round(remainingCalories / 4); // 4 cal/g
  
  // Safety checks
  const finalProtein = Math.max(50, Math.min(300, protein)); // 50-300g protein
  const finalFat = Math.max(30, Math.min(150, fat)); // 30-150g fat
  const finalCarbs = Math.max(50, Math.min(500, carbs)); // 50-500g carbs

  return { 
    calories,
    protein: finalProtein, 
    fat: finalFat, 
    carbs: finalCarbs
  };
};

export const calculateMacroGoals = (profileData: ProfileData): MacroGoals => {
  const calories = calculateCalories(profileData);
  return calculateMacros(calories, profileData);
};
