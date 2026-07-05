CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  theme_color text,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_restaurant_idx ON categories(restaurant_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  preparation_time numeric NOT NULL,
  calories numeric NOT NULL,
  dietary text[] NOT NULL DEFAULT '{}',
  image_url text,
  is_popular boolean NOT NULL DEFAULT false,
  price numeric(10, 2) NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_items_restaurant_idx ON menu_items(restaurant_id);

-- DEMO SEED
INSERT INTO restaurants (id, name, description, theme_color, slug)
VALUES ('11111111-1111-4111-8111-111111111111', 'Demo Bistro',
  'A cozy demo restaurant showcasing MenuMind.', '#e48d3d', 'demo-bistro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, restaurant_id, name, description, is_active) VALUES
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'Starters', 'Small plates to begin your meal', true),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Mains', 'Hearty main courses', true),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111111', 'Desserts', 'Sweet endings', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items
  (id, restaurant_id, category_id, name, description, preparation_time, calories, dietary, image_url, is_popular, price, is_available)
VALUES
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 'Bruschetta', 'Grilled bread with tomatoes, garlic and basil', 10, 220, '{vegetarian}', '', true, 6.50, true),
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Margherita Pizza', 'San Marzano tomatoes, mozzarella, fresh basil', 20, 850, '{vegetarian}', '', true, 11.90, true),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Grilled Salmon', 'Atlantic salmon with seasonal vegetables', 25, 640, '{gluten-free}', '', false, 18.50, true),
  ('33333333-3333-4333-8333-333333333334', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222223', 'Tiramisu', 'Classic Italian dessert with espresso and mascarpone', 5, 450, '{vegetarian}', '', true, 7.00, true)
ON CONFLICT (id) DO NOTHING;
