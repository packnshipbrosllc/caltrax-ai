'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Utensils, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { simpleStorage } from '@/lib/storage';
import { addFoodEntry } from '@/lib/macro-storage-supabase';
import { useUser } from '@clerk/nextjs';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  serving: string;
}

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: number;
}

interface ManualFoodInputProps {
  onClose: () => void;
  onFoodAdded: () => void;
}

const ManualFoodInput = ({ onClose, onFoodAdded }: ManualFoodInputProps) => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    servingSize: '100g'
  });
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Sample food database - in a real app, this would be much larger and come from an API
  const foodDatabase: FoodItem[] = [
    { name: 'Chicken Breast (cooked)', calories: 165, protein: 31, fat: 3.6, carbs: 0, serving: '100g' },
    { name: 'Brown Rice (cooked)', calories: 111, protein: 2.6, fat: 0.9, carbs: 23, serving: '100g' },
    { name: 'Salmon (cooked)', calories: 208, protein: 25, fat: 12, carbs: 0, serving: '100g' },
    { name: 'Avocado', calories: 160, protein: 2, fat: 15, carbs: 9, serving: '100g' },
    { name: 'Greek Yogurt (plain)', calories: 59, protein: 10, fat: 0.4, carbs: 3.6, serving: '100g' },
    { name: 'Eggs (large)', calories: 70, protein: 6, fat: 5, carbs: 0.6, serving: '1 piece' },
    { name: 'Oatmeal (cooked)', calories: 68, protein: 2.4, fat: 1.4, carbs: 12, serving: '100g' },
    { name: 'Banana (medium)', calories: 105, protein: 1.3, fat: 0.4, carbs: 27, serving: '1 piece' },
    { name: 'Almonds', calories: 579, protein: 21, fat: 50, carbs: 22, serving: '100g' },
    { name: 'Sweet Potato (cooked)', calories: 86, protein: 1.6, fat: 0.1, carbs: 20, serving: '100g' },
    { name: 'Broccoli (cooked)', calories: 35, protein: 2.8, fat: 0.4, carbs: 7, serving: '100g' },
    { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, fat: 1.9, carbs: 22, serving: '100g' },
    { name: 'Cottage Cheese', calories: 98, protein: 11, fat: 4.3, carbs: 3.4, serving: '100g' },
    { name: 'Apple (medium)', calories: 95, protein: 0.5, fat: 0.3, carbs: 25, serving: '1 piece' },
    { name: 'Spinach (raw)', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, serving: '100g' },
    { name: 'Whole Wheat Bread', calories: 247, protein: 13, fat: 4.2, carbs: 41, serving: '100g' },
    { name: 'Tuna (canned in water)', calories: 116, protein: 26, fat: 0.8, carbs: 0, serving: '100g' },
    { name: 'Olive Oil', calories: 884, protein: 0, fat: 100, carbs: 0, serving: '100ml' },
    { name: 'Milk (2%)', calories: 50, protein: 3.3, fat: 2, carbs: 4.7, serving: '100ml' },
    { name: 'Blueberries', calories: 57, protein: 0.7, fat: 0.3, carbs: 14, serving: '100g' }
  ];

  const units = [
    { value: 'serving', label: 'Serving' },
    { value: 'g', label: 'Grams' },
    { value: 'oz', label: 'Ounces' },
    { value: 'cup', label: 'Cup' },
    { value: 'tbsp', label: 'Tablespoon' },
    { value: 'tsp', label: 'Teaspoon' },
    { value: 'piece', label: 'Piece' }
  ];

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(true);
      const results = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery('');
    setSearchResults([]);
  };

  const calculateNutrition = (food: FoodItem, qty: number, unit: string) => {
    // For simplicity, we'll assume 1 serving = 100g for most foods
    // In a real app, you'd have more sophisticated unit conversions
    let multiplier = qty;
    
    if (unit === 'g' && food.serving.includes('100g')) {
      multiplier = qty / 100;
    } else if (unit === 'oz' && food.serving.includes('100g')) {
      multiplier = (qty * 28.35) / 100; // Convert oz to grams
    }
    
    return {
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      fat: Math.round(food.fat * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10
    };
  };

  const handleAddFood = async (food: FoodItem, qty: number, unit: string) => {
    if (!user?.id) return;
    
    const nutrition = calculateNutrition(food, qty, unit);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const entry = {
      name: `${food.name} (${qty} ${unit})`,
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carbs: nutrition.carbs,
      quantity: qty,
      unit: unit,
      date: today,
    };

    const savedEntry = await addFoodEntry(user.id, entry);
    if (savedEntry) {
      onFoodAdded();
      onClose();
    }
  };

  const addCustomFood = () => {
    if (!customFood.name || !customFood.calories || !customFood.protein || !customFood.fat || !customFood.carbs) {
      alert('Please fill in all nutrition fields');
      return;
    }

    const food: FoodItem = {
      name: customFood.name,
      calories: parseFloat(customFood.calories),
      protein: parseFloat(customFood.protein),
      fat: parseFloat(customFood.fat),
      carbs: parseFloat(customFood.carbs),
      serving: customFood.servingSize
    };

    addFoodEntry(food, quantity, unit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Add Food
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((food, index) => (
                  <button
                    key={index}
                    onClick={() => handleFoodSelect(food)}
                    className="w-full p-3 text-left hover:bg-base-200 rounded-lg transition-colors"
                  >
                    <div className="font-medium">{food.name}</div>
                    <div className="text-sm text-base-content/70">
                      {food.calories} cal • {food.protein}g protein • {food.fat}g fat • {food.carbs}g carbs
                    </div>
                    <div className="text-xs text-base-content/50">Per {food.serving}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFood && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-base-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{selectedFood.name}</h3>
                    <p className="text-sm text-base-content/70">Per {selectedFood.serving}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFood(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      min="0.1"
                      step="0.1"
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      {units.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nutrition Preview */}
                <div className="bg-base-100 p-3 rounded-lg mb-4">
                  <div className="text-sm font-medium text-base-content mb-2">Nutrition (calculated):</div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-base-content/70">Calories</div>
                      <div className="font-medium">{calculateNutrition(selectedFood, quantity, unit).calories}</div>
                    </div>
                    <div>
                      <div className="text-base-content/70">Protein</div>
                      <div className="font-medium">{calculateNutrition(selectedFood, quantity, unit).protein}g</div>
                    </div>
                    <div>
                      <div className="text-base-content/70">Fat</div>
                      <div className="font-medium">{calculateNutrition(selectedFood, quantity, unit).fat}g</div>
                    </div>
                    <div>
                      <div className="text-base-content/70">Carbs</div>
                      <div className="font-medium">{calculateNutrition(selectedFood, quantity, unit).carbs}g</div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleAddFood(selectedFood, quantity, unit)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Today's Log
                </Button>
              </motion.div>
            )}

            {/* Custom Food Form */}
            {!selectedFood && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Add Custom Food</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomForm(!showCustomForm)}
                  >
                    {showCustomForm ? 'Cancel' : 'Add Custom'}
                  </Button>
                </div>

                {showCustomForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 bg-base-200 rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-1">
                        Food Name
                      </label>
                      <input
                        type="text"
                        value={customFood.name}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Homemade Pizza"
                        className="input input-bordered w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Calories
                        </label>
                        <input
                          type="number"
                          value={customFood.calories}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                          placeholder="250"
                          className="input input-bordered w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          value={customFood.protein}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                          placeholder="12"
                          className="input input-bordered w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          value={customFood.fat}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                          placeholder="8"
                          className="input input-bordered w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          value={customFood.carbs}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                          placeholder="30"
                          className="input input-bordered w-full"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={addCustomFood} className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Food
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ManualFoodInput;
