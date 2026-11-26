import { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { toLocalDateKey } from '../../lib/analytics';
import Nutrition from './Nutrition';

export default function LocalNutrition() {
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(new Date()));
  const user = useAppStore((s) => s.user);
  const foods = useAppStore((s) => s.foods);
  const mealItems = useAppStore((s) => s.mealItems);
  const addWater = useAppStore((s) => s.addWater);
  const logMealItem = useAppStore((s) => s.logMealItem);
  const completeMeal = useAppStore((s) => s.completeMeal);
  const removeMealItem = useAppStore((s) => s.removeMealItem);
  const ensureMealsForDate = useAppStore((s) => s.ensureMealsForDate);
  const dailyWater = useAppStore((s) => s.waterLogs[selectedDate] ?? 0);

  // Track changes made by meal actions and by ensuring the selected day.
  const meals = useAppStore(s => s.meals);
  const mealTemplates = useAppStore(s => s.mealTemplates);
  const todayMeals = meals.filter(meal => meal.date === selectedDate).sort((a, b) =>
    mealTemplates.findIndex(template => template.id === a.template_id) -
    mealTemplates.findIndex(template => template.id === b.template_id),
  );

  useEffect(() => {
    ensureMealsForDate(selectedDate);
  }, [selectedDate, ensureMealsForDate]);

  return <Nutrition {...{ selectedDate, setSelectedDate, user, foods, mealItems, addWater, logMealItem, completeMeal, removeMealItem, dailyWater }}
    meals={todayMeals} waterTarget={4000} />;
}
