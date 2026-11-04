"""
Builds src/data/meal-library.ts: the meal planner's library of meals.

Every ingredient is an entry in the Australian Food Composition Database
(AFCD Release 3, (c) FSANZ, CC BY-SA 3.0 AU). Nutrition per 100 g is copied
from supabase/migrations/*_afcd_release_3_data.sql, so meal nutrition is
calculated from real data rather than guessed.

Allergens and diet suitability are worked out from each ingredient's
category, never written by hand per meal, so a meal can't be mislabelled.

Usage:  python3 scripts/meals/build_meal_library.py
"""

import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AFCD_SQL = glob.glob(os.path.join(ROOT, 'supabase/migrations/*_afcd_release_3_data.sql'))[0]
OUT = os.path.join(ROOT, 'src/data/meal-library.ts')

# ---------------------------------------------------------------------------
# Ingredients: key -> (AFCD id, shopping-list name, aisle, kind, allergens)
#   kind: plant | dairy | egg | poultry | beef | lamb | pork | game | fish | shellfish
#   allergens use the app's allergy names (see ALLERGY_KEYS in the app).
# ---------------------------------------------------------------------------
I = {
    'oats': ('F006143', 'Rolled oats', 'Pantry', 'plant', ['gluten']),
    'milk': ('F005634', 'Milk', 'Dairy & eggs', 'dairy', ['milk']),
    'milk_skim': ('F005637', 'Skim milk', 'Dairy & eggs', 'dairy', ['milk']),
    'soy_milk': ('F008721', 'Soy milk', 'Dairy & eggs', 'plant', ['soy']),
    'yoghurt': ('F009694', 'Natural yoghurt', 'Dairy & eggs', 'dairy', ['milk']),
    'yoghurt_protein': ('F009809', 'High-protein yoghurt', 'Dairy & eggs', 'dairy', ['milk']),
    'cheddar': ('F002413', 'Cheddar cheese (reduced fat)', 'Dairy & eggs', 'dairy', ['milk']),
    'feta': ('F002452', 'Feta', 'Dairy & eggs', 'dairy', ['milk']),
    'parmesan': ('F002479', 'Parmesan', 'Dairy & eggs', 'dairy', ['milk']),
    'cottage': ('F002435', 'Cottage cheese', 'Dairy & eggs', 'dairy', ['milk']),
    'egg': ('F003729', 'Eggs', 'Dairy & eggs', 'egg', ['eggs']),
    'egg_boiled': ('F003721', 'Eggs', 'Dairy & eggs', 'egg', ['eggs']),
    'whey': ('F007493', 'Whey protein powder', 'Pantry', 'dairy', ['milk']),
    'banana': ('F000262', 'Bananas', 'Fruit & veg', 'plant', []),
    'blueberry': ('F001289', 'Frozen blueberries', 'Frozen', 'plant', []),
    'strawberry': ('F008952', 'Strawberries', 'Fruit & veg', 'plant', []),
    'apple': ('F000091', 'Apples', 'Fruit & veg', 'plant', []),
    'orange': ('F006277', 'Oranges', 'Fruit & veg', 'plant', []),
    'mango': ('F005299', 'Mango', 'Fruit & veg', 'plant', []),
    'avocado': ('F000162', 'Avocado', 'Fruit & veg', 'plant', []),
    'tomato': ('F009193', 'Tomatoes', 'Fruit & veg', 'plant', []),
    'cherry_tomato': ('F009190', 'Cherry tomatoes', 'Fruit & veg', 'plant', []),
    'spinach': ('F008749', 'Baby spinach', 'Fruit & veg', 'plant', []),
    'rocket': ('F007712', 'Rocket', 'Fruit & veg', 'plant', []),
    'lettuce': ('F005191', 'Cos lettuce', 'Fruit & veg', 'plant', []),
    'cucumber': ('F003321', 'Lebanese cucumber', 'Fruit & veg', 'plant', []),
    'capsicum': ('F002247', 'Red capsicum', 'Fruit & veg', 'plant', []),
    'onion': ('F006225', 'Brown onion', 'Fruit & veg', 'plant', []),
    'carrot': ('F002276', 'Carrots', 'Fruit & veg', 'plant', []),
    'broccoli': ('F001905', 'Broccoli', 'Fruit & veg', 'plant', []),
    'zucchini': ('F009775', 'Zucchini', 'Fruit & veg', 'plant', []),
    'mushroom': ('F005946', 'Mushrooms', 'Fruit & veg', 'plant', []),
    'sweet_potato': ('F009035', 'Sweet potato', 'Fruit & veg', 'plant', []),
    'potato': ('F007247', 'Potatoes', 'Fruit & veg', 'plant', []),
    'pumpkin': ('F007535', 'Butternut pumpkin', 'Fruit & veg', 'plant', []),
    'green_beans': ('F000431', 'Green beans', 'Fruit & veg', 'plant', []),
    'bok_choy': ('F001301', 'Bok choy', 'Fruit & veg', 'plant', []),
    'lemon': ('F005174', 'Lemon', 'Fruit & veg', 'plant', []),
    'garlic': ('F004193', 'Garlic', 'Fruit & veg', 'plant', []),
    'chicken_breast': ('F002594', 'Chicken breast', 'Meat & seafood', 'poultry', []),
    'chicken_thigh': ('F002806', 'Chicken thigh fillets', 'Meat & seafood', 'poultry', []),
    'turkey': ('F009307', 'Turkey breast', 'Meat & seafood', 'poultry', []),
    'beef_mince': ('F000666', 'Lean beef mince', 'Meat & seafood', 'beef', []),
    'beef_steak': ('F000739', 'Rump steak', 'Meat & seafood', 'beef', []),
    'lamb': ('F004899', 'Lamb chump chops', 'Meat & seafood', 'lamb', []),
    'pork_loin': ('F007019', 'Pork loin', 'Meat & seafood', 'pork', []),
    'ham': ('F004299', 'Lean ham', 'Meat & seafood', 'pork', []),
    'kangaroo': ('F004787', 'Kangaroo fillet', 'Meat & seafood', 'game', []),
    'salmon': ('F007827', 'Salmon fillet', 'Meat & seafood', 'fish', ['fish']),
    'tuna': ('F009285', 'Canned tuna in brine', 'Pantry', 'fish', ['fish']),
    'barramundi': ('F000386', 'Barramundi fillet', 'Meat & seafood', 'fish', ['fish']),
    'prawns': ('F007424', 'Raw prawns', 'Meat & seafood', 'shellfish', ['shellfish']),
    'tofu': ('F009176', 'Firm tofu', 'Fruit & veg', 'plant', ['soy']),
    'chickpeas': ('F002880', 'Canned chickpeas', 'Pantry', 'plant', []),
    'lentils': ('F005177', 'Lentils (cooked)', 'Pantry', 'plant', []),
    'kidney_beans': ('F000448', 'Canned kidney beans', 'Pantry', 'plant', []),
    'rice_white': ('F007661', 'White rice (cooked)', 'Pantry', 'plant', []),
    'rice_brown': ('F007641', 'Brown rice (cooked)', 'Pantry', 'plant', []),
    'pasta': ('F006456', 'Pasta (cooked)', 'Pantry', 'plant', ['gluten']),
    'rice_noodles': ('F006038', 'Rice noodles (cooked)', 'Pantry', 'plant', []),
    'quinoa': ('F007596', 'Quinoa (cooked)', 'Pantry', 'plant', []),
    'couscous': ('F003235', 'Couscous (cooked)', 'Pantry', 'plant', ['gluten']),
    'bread': ('F001621', 'Mixed grain bread', 'Bakery', 'plant', ['gluten']),
    'roll': ('F001360', 'Wholemeal bread rolls', 'Bakery', 'plant', ['gluten']),
    'wrap': ('F001415', 'Wraps', 'Bakery', 'plant', ['gluten']),
    'granola': ('F009807', 'Granola with nuts', 'Pantry', 'plant', ['gluten', 'tree_nuts']),
    'rice_crackers': ('F001152', 'Rice crackers', 'Pantry', 'plant', []),
    'hummus': ('F003539', 'Hummus', 'Dairy & eggs', 'plant', ['sesame']),
    'peanut_butter': ('F006579', 'Peanut butter (no added sugar)', 'Pantry', 'plant', ['peanuts']),
    'almonds': ('F006081', 'Almonds', 'Pantry', 'plant', ['tree_nuts']),
    'walnuts': ('F006116', 'Walnuts', 'Pantry', 'plant', ['tree_nuts']),
    'chia': ('F008209', 'Chia seeds', 'Pantry', 'plant', []),
    'honey': ('F004380', 'Honey', 'Pantry', 'animal_product', []),
    'maple': ('F009052', 'Maple syrup', 'Pantry', 'plant', []),
    'cinnamon': ('F002963', 'Ground cinnamon', 'Pantry', 'plant', []),
    'olive_oil': ('F006177', 'Olive oil', 'Pantry', 'plant', []),
    'soy_sauce': ('F008067', 'Reduced-salt soy sauce', 'Pantry', 'plant', ['soy', 'gluten']),
    'pasta_sauce': ('F008050', 'Tomato pasta sauce', 'Pantry', 'plant', []),
    'salsa': ('F008056', 'Tomato salsa', 'Pantry', 'plant', []),
    # Thai curry pastes usually contain shrimp paste or fish sauce.
    'curry_paste': ('F006469', 'Green curry paste', 'Pantry', 'fish', ['fish', 'shellfish']),
    'curry_powder': ('F003337', 'Curry powder', 'Pantry', 'plant', []),
    'pesto': ('F008029', 'Basil pesto', 'Pantry', 'dairy', ['milk', 'tree_nuts']),
    'mayo': ('F005437', 'Light mayonnaise', 'Pantry', 'egg', ['eggs']),
    # Most dark chocolate contains (or may contain) milk.
    'dark_choc': ('F002921', 'Dark chocolate', 'Pantry', 'dairy', ['milk', 'soy']),
}

# ---------------------------------------------------------------------------
# Meals: (id, name, meal type, cost 1-3, minutes, [(ingredient, grams)], method)
# ---------------------------------------------------------------------------
MEALS = [
    # Breakfast
    ('berry-protein-oats', 'Berry oats with chia', 'breakfast', 1, 10,
     [('oats', 60), ('milk', 250), ('blueberry', 80), ('chia', 10), ('honey', 10)],
     'Simmer oats in milk for 5 minutes, stirring. Top with blueberries, chia and a drizzle of honey.'),
    ('yoghurt-granola-bowl', 'Yoghurt, granola & strawberries', 'breakfast', 2, 5,
     [('yoghurt', 200), ('granola', 40), ('strawberry', 100), ('honey', 10)],
     'Spoon yoghurt into a bowl and top with sliced strawberries, granola and honey.'),
    ('scrambled-eggs-toast', 'Scrambled eggs on toast', 'breakfast', 1, 10,
     [('egg', 150), ('milk', 30), ('bread', 70), ('spinach', 30), ('olive_oil', 5)],
     'Whisk eggs with milk. Cook gently in oil, stirring, then fold through spinach. Serve on toast.'),
    ('avocado-toast-eggs', 'Avocado toast with poached eggs', 'breakfast', 2, 12,
     [('bread', 70), ('avocado', 60), ('egg', 100), ('cherry_tomato', 60), ('lemon', 5)],
     'Poach eggs for 3 minutes. Mash avocado with lemon, spread on toast, top with eggs and tomatoes.'),
    ('pb-banana-toast', 'Peanut butter & banana toast', 'breakfast', 1, 5,
     [('bread', 70), ('peanut_butter', 25), ('banana', 120)],
     'Toast the bread, spread with peanut butter and top with sliced banana.'),
    ('protein-smoothie', 'Banana protein smoothie', 'breakfast', 2, 5,
     [('whey', 30), ('milk', 300), ('banana', 120), ('oats', 20)],
     'Blend everything with a handful of ice until smooth.'),
    ('veggie-omelette', 'Mushroom & capsicum omelette', 'breakfast', 1, 12,
     [('egg', 150), ('mushroom', 60), ('capsicum', 50), ('spinach', 30), ('cheddar', 20), ('olive_oil', 5)],
     'Soften the vegetables in oil, pour over beaten eggs, sprinkle with cheese and fold when set.'),
    ('tofu-scramble-wrap', 'Tofu scramble wrap', 'breakfast', 1, 12,
     [('tofu', 150), ('spinach', 30), ('capsicum', 50), ('onion', 30), ('wrap', 60), ('olive_oil', 5)],
     'Crumble tofu into a pan with oil, onion and capsicum, cook 5 minutes, add spinach and wrap.'),
    ('cottage-tomato-toast', 'Cottage cheese & tomato toast', 'breakfast', 1, 5,
     [('bread', 70), ('cottage', 100), ('tomato', 80)],
     'Toast the bread, spread with cottage cheese and top with sliced tomato and pepper.'),
    ('mango-chia-pudding', 'Mango chia pudding', 'breakfast', 2, 5,
     [('chia', 30), ('soy_milk', 250), ('mango', 100), ('maple', 10)],
     'Stir chia into soy milk and maple syrup, chill overnight, and top with mango.'),
    ('breakfast-burrito', 'Egg & bean breakfast burrito', 'breakfast', 1, 12,
     [('egg', 100), ('kidney_beans', 60), ('cheddar', 20), ('salsa', 40), ('wrap', 60)],
     'Scramble the eggs, warm the beans, and roll up in a wrap with cheese and salsa.'),
    ('apple-cinnamon-oats', 'Apple cinnamon overnight oats', 'breakfast', 1, 5,
     [('oats', 60), ('soy_milk', 200), ('apple', 120), ('cinnamon', 2), ('walnuts', 15)],
     'Mix oats, soy milk, grated apple and cinnamon. Chill overnight and top with walnuts.'),

    # Lunch
    ('chicken-salad-wrap', 'Chicken salad wrap', 'lunch', 2, 10,
     [('chicken_breast', 120), ('wrap', 60), ('lettuce', 30), ('tomato', 60), ('cucumber', 40), ('mayo', 15)],
     'Grill the chicken, slice, and wrap with salad and light mayo.'),
    ('tuna-rice-bowl', 'Tuna & brown rice bowl', 'lunch', 1, 8,
     [('tuna', 95), ('rice_brown', 150), ('cucumber', 60), ('avocado', 40), ('carrot', 40), ('soy_sauce', 10)],
     'Top warm rice with tuna, sliced cucumber, grated carrot and avocado. Drizzle with soy sauce.'),
    ('chicken-quinoa-salad', 'Chicken, quinoa & feta salad', 'lunch', 2, 15,
     [('chicken_breast', 120), ('quinoa', 120), ('rocket', 30), ('cherry_tomato', 80), ('feta', 25), ('olive_oil', 7), ('lemon', 10)],
     'Grill the chicken. Toss quinoa with rocket, tomatoes, feta, oil and lemon, and top with chicken.'),
    ('lentil-veg-soup', 'Red lentil & vegetable soup', 'lunch', 1, 30,
     [('lentils', 200), ('carrot', 80), ('onion', 50), ('tomato', 100), ('olive_oil', 5), ('roll', 60)],
     'Soften onion and carrot in oil, add lentils, tomato and 300 ml water, simmer 20 minutes. Serve with a roll.'),
    ('chickpea-salad', 'Mediterranean chickpea salad', 'lunch', 1, 10,
     [('chickpeas', 150), ('cucumber', 80), ('tomato', 100), ('feta', 30), ('olive_oil', 7), ('lemon', 10)],
     'Toss rinsed chickpeas with chopped cucumber and tomato, crumbled feta, oil and lemon.'),
    ('turkey-sandwich', 'Turkey & salad sandwich', 'lunch', 2, 5,
     [('bread', 80), ('turkey', 80), ('lettuce', 20), ('tomato', 50), ('cheddar', 20)],
     'Layer turkey, cheese, lettuce and tomato between the bread.'),
    ('egg-salad-roll', 'Egg & salad roll', 'lunch', 1, 12,
     [('roll', 70), ('egg_boiled', 100), ('lettuce', 20), ('mayo', 15), ('tomato', 50)],
     'Mash boiled eggs with light mayo and fill the roll with egg, lettuce and tomato.'),
    ('salmon-poke-bowl', 'Salmon poke bowl', 'lunch', 3, 15,
     [('salmon', 100), ('rice_white', 150), ('cucumber', 60), ('avocado', 40), ('carrot', 40), ('soy_sauce', 10)],
     'Pan-cook the salmon and flake it over rice with cucumber, carrot and avocado. Add soy sauce.'),
    ('beef-burrito-bowl', 'Beef burrito bowl', 'lunch', 2, 15,
     [('beef_mince', 120), ('rice_brown', 120), ('kidney_beans', 60), ('salsa', 50), ('lettuce', 30), ('cheddar', 20)],
     'Brown the mince with a pinch of cumin and paprika. Serve over rice with beans, salsa, lettuce and cheese.'),
    ('hummus-veg-wrap', 'Hummus & crunchy veg wrap', 'lunch', 1, 5,
     [('wrap', 60), ('hummus', 50), ('chickpeas', 60), ('rocket', 20), ('capsicum', 50), ('carrot', 40)],
     'Spread the wrap with hummus, fill with chickpeas and sliced vegetables, and roll up.'),
    ('tofu-noodle-salad', 'Tofu & rice noodle salad', 'lunch', 1, 15,
     [('tofu', 120), ('rice_noodles', 150), ('carrot', 50), ('cucumber', 50), ('soy_sauce', 10), ('lemon', 10)],
     'Pan-fry cubed tofu until golden. Toss with noodles, shredded veg, soy sauce and lemon.'),
    ('prawn-noodle-salad', 'Prawn & noodle salad', 'lunch', 3, 15,
     [('prawns', 120), ('rice_noodles', 150), ('carrot', 40), ('cucumber', 40), ('lettuce', 20), ('lemon', 10), ('soy_sauce', 10)],
     'Cook the prawns for 2–3 minutes. Toss with noodles, salad, lemon and soy sauce.'),
    ('ham-cheese-toastie', 'Ham, cheese & tomato toastie', 'lunch', 1, 8,
     [('bread', 80), ('ham', 50), ('cheddar', 25), ('tomato', 50)],
     'Fill the bread with ham, cheese and tomato and toast until golden.'),

    # Dinner
    ('chicken-stir-fry', 'Chicken & vegetable stir-fry', 'dinner', 2, 20,
     [('chicken_breast', 150), ('broccoli', 100), ('capsicum', 60), ('carrot', 50), ('rice_white', 150), ('soy_sauce', 15), ('olive_oil', 7)],
     'Stir-fry sliced chicken in oil until cooked, add vegetables for 3 minutes, then soy sauce. Serve with rice.'),
    ('spaghetti-bolognese', 'Spaghetti bolognese', 'dinner', 1, 25,
     [('beef_mince', 130), ('pasta', 180), ('pasta_sauce', 150), ('onion', 40), ('parmesan', 10)],
     'Brown the mince with onion, add pasta sauce and simmer 10 minutes. Serve over pasta with parmesan.'),
    ('salmon-sweet-potato', 'Salmon with sweet potato & greens', 'dinner', 3, 30,
     [('salmon', 150), ('sweet_potato', 200), ('green_beans', 100), ('olive_oil', 5), ('lemon', 10)],
     'Roast sweet potato wedges at 200°C for 25 minutes; add salmon for the last 12. Steam the beans.'),
    ('steak-potatoes-salad', 'Steak with potatoes & salad', 'dinner', 3, 25,
     [('beef_steak', 170), ('potato', 200), ('rocket', 30), ('cherry_tomato', 60), ('olive_oil', 7)],
     'Boil or roast the potatoes. Grill the steak to your liking, rest it, and serve with rocket and tomatoes.'),
    ('green-chicken-curry', 'Thai green chicken curry', 'dinner', 2, 25,
     [('chicken_thigh', 150), ('curry_paste', 20), ('zucchini', 80), ('capsicum', 50), ('rice_white', 150)],
     'Fry the curry paste, add chicken and 150 ml water, simmer 10 minutes, add vegetables for 5. Serve with rice.'),
    ('kangaroo-pumpkin-quinoa', 'Kangaroo with pumpkin & quinoa', 'dinner', 2, 30,
     [('kangaroo', 150), ('pumpkin', 150), ('quinoa', 120), ('spinach', 30), ('olive_oil', 7)],
     'Roast pumpkin at 200°C for 25 minutes. Sear the kangaroo 2–3 minutes each side and rest. Serve with quinoa and spinach.'),
    ('lamb-couscous', 'Lamb with couscous & roast veg', 'dinner', 3, 30,
     [('lamb', 150), ('couscous', 150), ('zucchini', 80), ('capsicum', 60), ('olive_oil', 7)],
     'Roast the vegetables at 200°C for 20 minutes. Grill the lamb, and serve with couscous.'),
    ('chickpea-tofu-curry', 'Chickpea & tofu curry', 'dinner', 1, 25,
     [('tofu', 120), ('chickpeas', 100), ('tomato', 150), ('spinach', 40), ('curry_powder', 6), ('olive_oil', 5), ('rice_brown', 150)],
     'Fry curry powder in oil for 30 seconds, add tomato, chickpeas and tofu, simmer 10 minutes, stir in spinach. Serve with rice.'),
    ('barramundi-bok-choy', 'Barramundi with rice & bok choy', 'dinner', 3, 20,
     [('barramundi', 160), ('rice_white', 150), ('bok_choy', 100), ('soy_sauce', 10), ('lemon', 10)],
     'Pan-cook the barramundi skin-side down. Steam the bok choy and serve with rice, soy and lemon.'),
    ('pesto-veg-pasta', 'Pesto pasta with vegetables', 'dinner', 2, 20,
     [('pasta', 180), ('pesto', 25), ('zucchini', 80), ('cherry_tomato', 80), ('spinach', 30), ('parmesan', 10)],
     'Sauté zucchini and tomatoes, toss with cooked pasta, pesto and spinach. Top with parmesan.'),
    ('beef-bean-chilli', 'Beef & bean chilli', 'dinner', 1, 30,
     [('beef_mince', 120), ('kidney_beans', 100), ('tomato', 150), ('onion', 40), ('capsicum', 50), ('rice_brown', 120)],
     'Brown the mince with onion and capsicum, add chilli powder, tomato and beans, simmer 15 minutes. Serve with rice.'),
    ('pork-noodle-stir-fry', 'Pork & vegetable noodles', 'dinner', 2, 20,
     [('pork_loin', 150), ('rice_noodles', 180), ('broccoli', 80), ('carrot', 50), ('soy_sauce', 15), ('olive_oil', 7)],
     'Stir-fry sliced pork until cooked, add vegetables, then noodles and soy sauce.'),
    ('lentil-bolognese', 'Lentil bolognese', 'dinner', 1, 25,
     [('lentils', 200), ('pasta', 180), ('pasta_sauce', 150), ('onion', 40), ('carrot', 50)],
     'Soften onion and grated carrot, add lentils and pasta sauce, simmer 10 minutes, and serve over pasta.'),
    ('garlic-prawn-noodles', 'Garlic prawn & bok choy noodles', 'dinner', 3, 15,
     [('prawns', 150), ('rice_noodles', 150), ('bok_choy', 80), ('capsicum', 60), ('soy_sauce', 15), ('garlic', 5), ('olive_oil', 7)],
     'Fry garlic in oil, add prawns for 2 minutes, then vegetables, noodles and soy sauce.'),
    ('chicken-tray-bake', 'Chicken & vegetable tray bake', 'dinner', 2, 40,
     [('chicken_thigh', 160), ('potato', 150), ('carrot', 80), ('broccoli', 80), ('olive_oil', 7)],
     'Toss everything in oil on a tray and roast at 200°C for 35 minutes, adding broccoli for the last 10.'),

    # Snacks
    ('apple-peanut-butter', 'Apple & peanut butter', 'snack', 1, 2,
     [('apple', 150), ('peanut_butter', 20)], 'Slice the apple and dip into peanut butter.'),
    ('protein-yoghurt-berries', 'Protein yoghurt & berries', 'snack', 1, 2,
     [('yoghurt_protein', 170), ('blueberry', 60)], 'Top the yoghurt with blueberries.'),
    ('almonds-orange', 'Almonds & an orange', 'snack', 2, 1,
     [('almonds', 30), ('orange', 130)], 'Grab a small handful of almonds and an orange.'),
    ('protein-shake', 'Protein shake', 'snack', 2, 2,
     [('whey', 30), ('milk_skim', 250)], 'Shake the protein powder with cold skim milk.'),
    ('hummus-veg-sticks', 'Hummus & veggie sticks', 'snack', 1, 5,
     [('hummus', 50), ('carrot', 80), ('cucumber', 80)], 'Cut carrot and cucumber into sticks and dip in hummus.'),
    ('rice-crackers-cottage', 'Rice crackers with cottage cheese', 'snack', 1, 3,
     [('rice_crackers', 20), ('cottage', 80), ('tomato', 50)], 'Top rice crackers with cottage cheese and tomato.'),
    ('boiled-eggs-tomatoes', 'Boiled eggs & cherry tomatoes', 'snack', 1, 10,
     [('egg_boiled', 100), ('cherry_tomato', 60)], 'Boil two eggs for 9 minutes and serve with tomatoes.'),
    ('banana-walnuts', 'Banana & walnuts', 'snack', 1, 1,
     [('banana', 120), ('walnuts', 15)], 'A banana with a small handful of walnuts.'),
    ('dark-choc-strawberries', 'Dark chocolate & strawberries', 'snack', 2, 2,
     [('dark_choc', 20), ('strawberry', 150)], 'A couple of squares of dark chocolate with fresh strawberries.'),
]

ANIMAL_MEAT = {'poultry', 'beef', 'lamb', 'pork', 'game'}


def load_afcd():
    sql = open(AFCD_SQL).read()
    rows = re.findall(r"^\('(F\w+)', '((?:[^']|'')*)', (?:'[^']*'|null), ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)", sql, re.M)
    return {r[0]: {'name': r[1].replace("''", "'"), 'kcal': float(r[2]), 'protein': float(r[3]),
                   'carbs': float(r[4]), 'fat': float(r[5])} for r in rows}


def diets_for(kinds, allergens, has_dairy_and_meat):
    has_meat = bool(kinds & ANIMAL_MEAT)
    has_seafood = bool(kinds & {'fish', 'shellfish'})
    diets = []
    if not has_meat and not has_seafood:
        diets.append('vegetarian')
        if not kinds & {'dairy', 'egg', 'animal_product'}:
            diets.append('vegan')
    if not has_meat:
        diets.append('pescatarian')
    if 'pork' not in kinds:
        diets.append('halal')
    if 'pork' not in kinds and 'shellfish' not in kinds and 'shellfish' not in allergens and not has_dairy_and_meat:
        diets.append('kosher')
    return diets


def main():
    afcd = load_afcd()
    ingredients = {}
    for key, (food_id, label, aisle, kind, allergens) in I.items():
        food = afcd[food_id]  # KeyError here means a wrong AFCD id
        ingredients[key] = {'foodId': food_id, 'label': label, 'aisle': aisle, 'kind': kind,
                            'allergens': allergens, 'per100g': {k: food[k] for k in ('kcal', 'protein', 'carbs', 'fat')},
                            'afcdName': food['name']}

    meals = []
    for meal_id, name, meal_type, cost, minutes, items, method in MEALS:
        totals = {'kcal': 0.0, 'protein': 0.0, 'carbs': 0.0, 'fat': 0.0}
        kinds, allergens = set(), set()
        for key, grams in items:
            ing = ingredients[key]
            for k in totals:
                totals[k] += ing['per100g'][k] * grams / 100
            kinds.add(ing['kind'])
            allergens.update(ing['allergens'])
        has_dairy_and_meat = 'dairy' in kinds and bool(kinds & ANIMAL_MEAT)
        diets = diets_for(kinds, allergens, has_dairy_and_meat)
        carbs_share = totals['carbs'] * 4 / max(totals['kcal'], 1)
        protein_share = totals['protein'] * 4 / max(totals['kcal'], 1)
        if carbs_share <= 0.2:
            diets.append('low_carb')
        if protein_share >= 0.3:
            diets.append('high_protein')
        meals.append({
            'id': meal_id, 'name': name, 'mealType': meal_type, 'cost': cost, 'minutes': minutes,
            'ingredients': [{'key': k, 'grams': g} for k, g in items], 'method': method,
            'perServing': {k: round(v, 1) for k, v in totals.items()},
            'allergens': sorted(allergens), 'diets': diets,
        })

    with open(OUT, 'w') as out:
        out.write('/**\n * GENERATED by scripts/meals/build_meal_library.py. Do not edit by hand.\n *\n')
        out.write(' * The meal planner\'s library. Ingredient nutrition is from the Australian Food\n')
        out.write(' * Composition Database (AFCD Release 3, (c) FSANZ, CC BY-SA 3.0 AU). Allergens and\n')
        out.write(' * diets are derived from ingredients, not written by hand.\n */\n\n')
        out.write("import type { Ingredient, LibraryMeal } from '@/lib/meal-planner';\n\n")
        out.write('export const INGREDIENTS: Record<string, Ingredient> = ')
        out.write(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != 'afcdName'} for k, v in ingredients.items()}, indent=2))
        out.write(';\n\nexport const MEALS: LibraryMeal[] = ')
        out.write(json.dumps(meals, indent=2, ensure_ascii=False))
        out.write(';\n')

    by_type = {}
    for meal in meals:
        by_type.setdefault(meal['mealType'], []).append(meal)
    for meal_type, items in by_type.items():
        print(f"{meal_type}: {len(items)} meals")
        for m in items:
            p = m['perServing']
            print(f"  {m['name']:<42} {p['kcal']:>6.0f} kcal  P{p['protein']:>5.1f}  {','.join(m['diets'])}  [{','.join(m['allergens'])}]")


if __name__ == '__main__':
    main()
