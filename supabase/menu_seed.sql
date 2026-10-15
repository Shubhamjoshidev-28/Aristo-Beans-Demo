-- Menu seed. Run in Supabase > SQL Editor AFTER schema.sql.
-- WARNING: this first deletes every existing menu item (including the old demo items), then inserts the menu below.
-- Items with one price use size 'Regular'. Edit prices/names later from the app's Menu panel.
delete from menu_items;

insert into menu_items (id, name, cat, size, price, avail, stock)
select gen_random_uuid()::text, name, cat, size, price, true, 100
from (values
-- TEA
('Simple Tea','Tea','Small',40),('Simple Tea','Tea','Large',54),
('Masala Tea','Tea','Small',44),('Masala Tea','Tea','Large',69),
('Paan Tea','Tea','Small',49),('Paan Tea','Tea','Large',79),
('Rose Tea','Tea','Small',49),('Rose Tea','Tea','Large',79),
('Chocolate Tea','Tea','Small',49),('Chocolate Tea','Tea','Large',79),
('Elaichi+Adark','Tea','Small',44),('Elaichi+Adark','Tea','Large',69),
('Badam+Kesar','Tea','Small',89),('Badam+Kesar','Tea','Large',119),
-- WITHOUT MILK HOT & COLD
('Lemon Tea','Tea Without Milk (Hot & Cold)','Regular',69),
('Lemon+Ginger+Mint Tea','Tea Without Milk (Hot & Cold)','Regular',79),
('Green Tea','Tea Without Milk (Hot & Cold)','Regular',79),
('Kangra Herbal Tea','Tea Without Milk (Hot & Cold)','Regular',99),
('Hibiscus Tea','Tea Without Milk (Hot & Cold)','Regular',130),
('Blue Tea','Tea Without Milk (Hot & Cold)','Regular',130),
('Lemon Iced Tea','Tea Without Milk (Hot & Cold)','Regular',119),
('Peach Iced Tea','Tea Without Milk (Hot & Cold)','Regular',119),
('Blue Iced Tea','Tea Without Milk (Hot & Cold)','Regular',139),
('Hibiscus Iced Tea','Tea Without Milk (Hot & Cold)','Regular',149),
-- BOBA TEA
('Blue Berry Boba Tea','Boba Tea','Regular',219),
('StrawBerry Boba Tea','Boba Tea','Regular',219),
-- SHOTS
('Jamun Shot','Shots','Regular',99),
('Kala Khatta Shot','Shots','Regular',89),
-- HOT COFFEE
('Espresso','Hot Coffee','Small',79),('Espresso','Hot Coffee','Double',119),
('Flat White','Hot Coffee','Regular',129),
('Cappuccino','Hot Coffee','Regular',139),
('Classic Latte','Hot Coffee','Regular',149),
('Hot Americano','Hot Coffee','Regular',119),
('Lungo','Hot Coffee','Regular',139),
('Espresso Romano','Hot Coffee','Regular',124),
('Cartado','Hot Coffee','Regular',159),
('Hot Chocolate','Hot Coffee','Regular',159),
('Mocha','Hot Coffee','Regular',179),
('Matcha Latte','Hot Coffee','Regular',199),
('Brown Sugar Coated Coffee','Hot Coffee','Regular',169),
-- MOJITO
('Virgin Mojito','Mojito','Regular',89),
('Mango Spices Mojito','Mojito','Regular',109),
('Black Current Mojito','Mojito','Regular',109),
('Green Apple Mojito','Mojito','Regular',109),
('Blue Curaco Mojito','Mojito','Regular',109),
('Crane Berry Mojito','Mojito','Regular',109),
('Watermelon Mojito','Mojito','Regular',109),
-- COLD DRINKS
('Coke','Cold Drinks','Regular',39),
('Sprite','Cold Drinks','Regular',39),
('Fanta','Cold Drinks','Regular',39),
-- COLD COFFEE
('Frappe Cold Coffee','Cold Coffee','Regular',129),
('Iced Americano Coffee','Cold Coffee','Regular',159),
('Iced Hazelnut Coffee','Cold Coffee','Regular',169),
('Iced Latte','Cold Coffee','Regular',169),
('Iced Caramel','Cold Coffee','Regular',169),
('Iced Chocolate','Cold Coffee','Regular',169),
('Iced Irish','Cold Coffee','Regular',179),
('Affogato','Cold Coffee','Regular',169),
('Glace','Cold Coffee','Regular',189),
('Sunrise Americano','Cold Coffee','Regular',219),
('Sunset Americano','Cold Coffee','Regular',219),
('Coconut Americano','Cold Coffee','Regular',219),
('GreenApple Americano','Cold Coffee','Regular',179),
('Matcha Strawberry Latte','Cold Coffee','Regular',209),
('Expresso Bomb','Cold Coffee','Regular',149),
-- SHAKES
('Mango Shake','Shakes','Regular',119),
('Banana Shake','Shakes','Regular',119),
('Oreo Shake','Shakes','Regular',139),
('Chocolate/Kitkat Shake','Shakes','Regular',129),
('Blue Berry Shake','Shakes','Regular',169),
('Strawberry Shake','Shakes','Regular',169),
('Butter Scotch Shake','Shakes','Regular',169),
('Biscoff Shake','Shakes','Regular',219),
-- BURGER
('Aloo Tikki Burger','Burger','Regular',59),
('Veg Burger','Burger','Regular',69),
('Crunchy Crispy Burger','Burger','Regular',109),
('Spicy Paneer Burger','Burger','Regular',129),
('Cheezy Paneer Burger','Burger','Regular',139),
-- WRAP
('Veg Wrap','Wrap','Regular',109),
('Aloo Tikki Wrap','Wrap','Regular',129),
('Mushroom Corn Wrap','Wrap','Regular',149),
('Paneer Wrap','Wrap','Regular',179),
('Avacado Wrap','Wrap','Regular',209),
('Pizza Seasoning Wrap','Wrap','Regular',229),
-- PASTA
('Alfredo Pasta (White Sauce)','Pasta','Regular',199),
('Arrabiatta Pasta (Red Sauce)','Pasta','Regular',209),
('Creamy Pasta','Pasta','Regular',229),
('Mix Sauce Pasta','Pasta','Regular',249),
-- MAGGI
('Plain Maggi','Maggi','Regular',39),
('Tadka Maggi','Maggi','Regular',79),
('Cheese Maggi','Maggi','Regular',109),
-- SANDWICH
('Veg Sandwich','Sandwich','Regular',119),
('Mushroom Corn Sandwich','Sandwich','Regular',139),
('Cheesy Paneer Sandwich','Sandwich','Regular',149),
('Avacado Sandwich','Sandwich','Regular',179),
('Cold Sandwich','Sandwich','1 pc',29),('Cold Sandwich','Sandwich','2 pc',54),
-- SALAD
('Veg Delight Salad','Salad','Regular',149),
('Italian Salad','Salad','Regular',169),
('Nacho Salad','Salad','Regular',179),
('Paneer Salad','Salad','Regular',209),
('Diet Salad','Salad','Regular',209),
-- PIZZA
('Margrita Pizza','Pizza','Small',119),('Margrita Pizza','Pizza','Medium',179),('Margrita Pizza','Pizza','Large',289),
('Mushroom Corn Pizza','Pizza','Small',139),('Mushroom Corn Pizza','Pizza','Medium',219),('Mushroom Corn Pizza','Pizza','Large',299),
('Farm House Pizza','Pizza','Small',169),('Farm House Pizza','Pizza','Medium',249),('Farm House Pizza','Pizza','Large',359),
('Paneer Pizza','Pizza','Small',209),('Paneer Pizza','Pizza','Medium',289),('Paneer Pizza','Pizza','Large',389),
-- MOMO'S & FRIES
('Veg Momo''s (Steamed)','Momo''s & Fries','Regular',99),
('Veg Momo''s (Fry)','Momo''s & Fries','Regular',109),
('Veg Momo''s (Baked)','Momo''s & Fries','Regular',139),
('Paneer Momo''s (Steamed)','Momo''s & Fries','Regular',109),
('Paneer Momo''s (Fry)','Momo''s & Fries','Regular',129),
('Paneer Momo''s (Baked)','Momo''s & Fries','Regular',149),
-- SIDES
('Sweet Corn','Sides','Regular',109),
('Crispy Corn','Sides','Regular',159),
('Bun Muska','Sides','Regular',39),
('Spring Rolls','Sides','Regular',109),
('Cigar Rolls','Sides','Regular',109),
('Veg Nuggets','Sides','Regular',109),
('Mushroom Duplex','Sides','Regular',139),
('Cheese Garlic Bread (Toast)','Sides','Regular',79),
('Garlic Stuffed Bread','Sides','Regular',149),
('Paneer Stuffed Garlic Bread','Sides','Regular',189),
('French Fry (Salted)','Sides','Regular',89),
('French Fry (Peri-Peri)','Sides','Regular',109),
('French Fry (Cheese Loaded)','Sides','Regular',139),
-- CHILLA
('Plain Besan Chilla','Chilla','Regular',49),
('Veg Besan Chilla','Chilla','Regular',79),
('Plain Moong Dal Chilla','Chilla','Regular',59),
('Veg Moong Dal Chilla','Chilla','Regular',89),
-- ARISTO SPECIAL BURRITO BOWL
('Maxican Burrito Bowl','Aristo Special Burrito Bowl','Regular',239),
('Maxican Paneer Burito Bowl','Aristo Special Burrito Bowl','Regular',279),
-- ADD-ONS
('Flavour Add-on: Vanilla','Add-ons','Regular',49),
('Flavour Add-on: Hazelnut','Add-ons','Regular',49),
('Flavour Add-on: Irish','Add-ons','Regular',49),
('Flavour Add-on: Caramel','Add-ons','Regular',49),
('Cheese Slice Add-on','Add-ons','Regular',20),
('Veggie Add-on (Margrita Pizza)','Add-ons','Regular',40)
) as v(name, cat, size, price);
