-- ============================================================
-- QeviDiet Database Schema for Supabase
-- PASTE THIS ENTIRE FILE into the Supabase SQL Editor and click RUN
-- URL: https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/sql/new
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. USERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan          VARCHAR(20)  DEFAULT 'free',
    is_active     BOOLEAN      DEFAULT TRUE,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 2. USER PROFILES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age                 INTEGER,
    gender              VARCHAR(10),
    height_cm           DECIMAL(5,2),
    weight_kg           DECIMAL(5,2),
    body_type           VARCHAR(20),
    job_type            VARCHAR(20),
    workout_frequency   INTEGER      DEFAULT 3,
    sleep_hours         DECIMAL(3,1) DEFAULT 7.0,
    water_intake_liters DECIMAL(3,1) DEFAULT 2.5,
    goal                VARCHAR(30),
    dietary_preference  VARCHAR(30)  DEFAULT 'none',
    target_weight_kg    DECIMAL(5,2),
    bmr                 DECIMAL(8,2),
    tdee                DECIMAL(8,2),
    target_calories     DECIMAL(8,2),
    target_protein_g    DECIMAL(6,2),
    target_carbs_g      DECIMAL(6,2),
    target_fat_g        DECIMAL(6,2),
    profile_completed   BOOLEAN      DEFAULT FALSE,
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 3. WEIGHT LOGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg   DECIMAL(5,2) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. WEEKLY DIET PLANS ────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_diet_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    goal            VARCHAR(30) NOT NULL,
    target_calories DECIMAL(8,2) NOT NULL,
    plan_data       JSONB NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. DAILY FOOD LOGS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type  VARCHAR(20),
    food_name  VARCHAR(200) NOT NULL,
    quantity_g DECIMAL(7,2) NOT NULL,
    calories   DECIMAL(7,2) DEFAULT 0,
    protein_g  DECIMAL(6,2) DEFAULT 0,
    carbs_g    DECIMAL(6,2) DEFAULT 0,
    fat_g      DECIMAL(6,2) DEFAULT 0,
    fiber_g    DECIMAL(6,2) DEFAULT 0,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. FOOD DATABASE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_database (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(200) NOT NULL,
    brand             VARCHAR(100),
    category          VARCHAR(50),
    calories_per_100g DECIMAL(7,2) NOT NULL,
    protein_per_100g  DECIMAL(6,2) DEFAULT 0,
    carbs_per_100g    DECIMAL(6,2) DEFAULT 0,
    fat_per_100g      DECIMAL(6,2) DEFAULT 0,
    fiber_per_100g    DECIMAL(6,2) DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DISABLE Row Level Security (we use our own JWT) ─────
ALTER TABLE users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs        DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_database     DISABLE ROW LEVEL SECURITY;

-- ─── AUTO updated_at TRIGGER ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_weekly_plans_updated_at
    BEFORE UPDATE ON weekly_diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED Food Database ───────────────────────────────────
INSERT INTO food_database (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g) VALUES
('Chicken Breast (grilled)', 'protein',    165, 31.0,  0.0,  3.6, 0.0),
('Egg (whole)',               'protein',    155, 13.0,  1.1, 11.0, 0.0),
('Egg White',                 'protein',     52, 11.0,  0.7,  0.2, 0.0),
('Tuna (canned in water)',    'protein',    116, 25.5,  0.0,  1.5, 0.0),
('Salmon (grilled)',          'protein',    208, 20.0,  0.0, 13.0, 0.0),
('Paneer',                    'protein',    265, 18.3,  1.2, 20.0, 0.0),
('Dal (lentils cooked)',      'protein',    116,  9.0, 20.0,  0.4, 7.9),
('Chickpeas (boiled)',        'protein',    164,  8.9, 27.0,  2.6, 7.6),
('Moong Dal',                 'protein',    105,  7.6, 19.0,  0.4, 8.2),
('Rajma (kidney beans)',      'protein',    127,  8.7, 22.8,  0.5, 6.4),
('Tofu (firm)',               'protein',     76,  8.0,  1.9,  4.8, 0.3),
('Brown Rice (cooked)',       'carbs',      123,  2.6, 26.0,  0.9, 1.8),
('White Rice (cooked)',       'carbs',      130,  2.7, 28.0,  0.3, 0.4),
('Oats (rolled)',             'carbs',      389, 17.0, 66.0,  7.0,10.6),
('Sweet Potato (boiled)',     'carbs',       76,  1.4, 17.7,  0.1, 2.5),
('Chapati (whole wheat)',     'carbs',      297,  9.7, 52.9,  5.7, 8.7),
('Quinoa (cooked)',           'carbs',      120,  4.4, 21.3,  1.9, 2.8),
('Idli (steamed)',            'carbs',       58,  2.0, 12.0,  0.4, 0.5),
('Dosa (plain)',              'carbs',      168,  3.6, 25.0,  5.5, 1.0),
('Upma',                      'carbs',      160,  4.0, 26.0,  5.0, 1.5),
('Poha',                      'carbs',      180,  3.5, 35.0,  3.5, 1.5),
('Banana',                    'fruits',      89,  1.1, 23.0,  0.3, 2.6),
('Apple',                     'fruits',      52,  0.3, 14.0,  0.2, 2.4),
('Mango',                     'fruits',      60,  0.8, 15.0,  0.4, 1.6),
('Orange',                    'fruits',      47,  0.9, 12.0,  0.1, 2.4),
('Papaya',                    'fruits',      43,  0.5, 11.0,  0.3, 1.7),
('Broccoli',                  'vegetables',  34,  2.8,  7.0,  0.4, 2.6),
('Spinach',                   'vegetables',  23,  2.9,  3.6,  0.4, 2.2),
('Carrot',                    'vegetables',  41,  0.9,  9.6,  0.2, 2.8),
('Cucumber',                  'vegetables',  16,  0.7,  4.0,  0.1, 0.5),
('Tomato',                    'vegetables',  18,  0.9,  3.9,  0.2, 1.2),
('Bell Pepper',               'vegetables',  31,  1.0,  6.0,  0.3, 2.1),
('Almonds',                   'fats',       579, 21.0, 22.0, 50.0,12.5),
('Avocado',                   'fats',       160,  2.0,  9.0, 15.0, 6.7),
('Peanut Butter',             'fats',       588, 25.0, 20.0, 50.0, 6.0),
('Walnuts',                   'fats',       654, 15.0, 14.0, 65.0, 6.7),
('Olive Oil',                 'fats',       884,  0.0,  0.0,100.0, 0.0),
('Greek Yogurt (low fat)',    'dairy',       59, 10.0,  3.6,  0.4, 0.0),
('Milk (full fat)',           'dairy',       61,  3.2,  4.8,  3.3, 0.0),
('Milk (skimmed)',            'dairy',       35,  3.4,  5.0,  0.2, 0.0),
('Curd (plain yogurt)',       'dairy',       61,  3.5,  4.7,  3.3, 0.0),
('Whey Protein (powder)',     'supplement', 380, 80.0,  8.0,  5.0, 0.0)
ON CONFLICT DO NOTHING;

-- ─── VERIFY tables created ────────────────────────────────
SELECT tablename, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.tablename AND table_schema = 'public') AS columns
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
