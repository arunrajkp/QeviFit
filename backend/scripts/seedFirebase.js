require('dotenv').config({ path: '../.env' });
const { db } = require('../config/firebase');

const foodItems = [
    { id: '1', name: 'Chicken Breast', category: 'protein', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, fiber_per_100g: 0 },
    { id: '2', name: 'Brown Rice', category: 'carbs', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, fiber_per_100g: 1.8 },
    { id: '3', name: 'Avocado', category: 'fats', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 8.5, fat_per_100g: 14.7, fiber_per_100g: 6.7 },
    { id: '4', name: 'Broccoli', category: 'vegetables', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 6.6, fat_per_100g: 0.4, fiber_per_100g: 2.6 },
    { id: '5', name: 'Eggs', category: 'protein', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, fiber_per_100g: 0 },
    { id: '6', name: 'Oatmeal', category: 'carbs', calories_per_100g: 68, protein_per_100g: 2.4, carbs_per_100g: 12, fat_per_100g: 1.4, fiber_per_100g: 1.7 }
];

async function seedFirebase() {
    console.log('🌱 Seeding Firestore `food_database`...');
    const batch = db.batch();

    for (const food of foodItems) {
        const docRef = db.collection('food_database').doc(food.id);
        batch.set(docRef, food);
    }

    await batch.commit();
    console.log('✅ Firestore seeded with sample foods successfully!');
    process.exit(0);
}

seedFirebase().catch(err => {
    console.error('❌ Failed to seed Firestore:', err);
    process.exit(1);
});
