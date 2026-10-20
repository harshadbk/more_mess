import { photos as p } from './photos'

/*
 * ⚠️ PLACEHOLDER MENU
 * The menu card image was not attached, so these items/prices are typical for a
 * sandwich stall. Replace names + prices below with the exact ones from your
 * menu card — everything on the site (tabs, search, counts, specials) reads from here.
 *
 * tags: 'popular' | 'chef' — controls the Popular / Chef Choice badges.
 */

export const categories = [
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪' },
  { id: 'toast', label: 'Toast', emoji: '🍞' },
  { id: 'grill', label: 'Grill', emoji: '🔥' },
  { id: 'slice', label: 'Slice', emoji: '🍕' },
  { id: 'burger', label: 'Burger', emoji: '🍔' },
  { id: 'fries', label: 'Fries', emoji: '🍟' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
]

const raw = {
  sandwich: [
    ['Bread Butter Sandwich', 30, 'Soft bread, generous salted butter — simple and comforting.', p.capreseStack],
    ['Chutney Sandwich', 35, 'Fresh green mint-coriander chutney on soft white bread.', p.slawSandwich],
    ['Veg Sandwich', 40, 'Cucumber, tomato, onion, boiled potato & house chutney.', p.slawSandwich, ['popular']],
    ['Jam Sandwich', 40, 'Sweet mixed-fruit jam — a kids’ favourite.', p.capreseStack],
    ['Aloo Sandwich', 50, 'Spiced potato masala layered with fresh veggies.', p.vegPattySandwich],
    ['Cheese Sandwich', 60, 'Loaded with grated cheese and a hint of black pepper.', p.capreseStack, ['popular']],
    ['Masala Sandwich', 60, 'Bombay-style masala with chaat spice & chutney.', p.vegPattySandwich],
    ['Veg Cheese Sandwich', 70, 'Classic veg sandwich buried under cheese.', p.baguette, ['popular']],
    ['Chocolate Sandwich', 70, 'Chocolate spread & grated chocolate — dessert in bread.', p.frenchToast],
    ['Corn Cheese Sandwich', 80, 'Sweet corn, capsicum & creamy cheese.', p.baguette],
    ['Paneer Sandwich', 90, 'Masala paneer bhurji with onion & capsicum.', p.vegPattySandwich, ['chef']],
    ['Club Sandwich', 110, 'Triple-decker with veggies, cheese, mayo & chutney.', p.slawSandwich, ['chef', 'popular']],
  ],
  toast: [
    ['Bread Butter Toast', 35, 'Golden toasted bread with melting butter.', p.cheeseToastBlue],
    ['Veg Toast', 50, 'Crisp toasted veg sandwich with chutney.', p.tomatoToast],
    ['Masala Toast', 60, 'Potato masala toasted till crunchy.', p.tomatoToast, ['popular']],
    ['Cheese Toast', 70, 'Crunchy toast with gooey melted cheese.', p.cheeseToastBlue, ['popular']],
    ['Veg Cheese Toast', 80, 'Veggies + cheese, toasted to perfection.', p.grilledCheese],
    ['Garlic Cheese Toast', 80, 'Garlic butter, mozzarella & oregano.', p.cheeseToastBlue, ['chef']],
    ['Chilli Cheese Toast', 80, 'Green chilli, cheese & a spicy kick.', p.grilledCheese],
  ],
  grill: [
    ['Veg Grill Sandwich', 70, 'Grilled with butter till crisp, layered with veggies.', p.grillTriangles, ['popular']],
    ['Cheese Grill Sandwich', 90, 'Grilled and oozing with cheese.', p.grilledCheese, ['popular']],
    ['Veg Cheese Grill Sandwich', 100, 'Our bestseller — veggies, cheese, crisp grill marks.', p.grillTriangles, ['popular', 'chef']],
    ['Schezwan Grill Sandwich', 100, 'Spicy schezwan sauce, veggies & cheese.', p.panini],
    ['Corn Cheese Grill Sandwich', 110, 'Sweet corn & cheese, grilled golden.', p.panini],
    ['Paneer Grill Sandwich', 120, 'Masala paneer grilled with cheese.', p.grillTriangles, ['chef']],
    ['Tandoori Paneer Grill', 130, 'Smoky tandoori paneer, onion & mint mayo.', p.panini, ['chef']],
  ],
  slice: [
    ['Veg Slice', 50, 'Open-faced bread slice with veggies & sauce, baked.', p.vegFlatbread],
    ['Cheese Slice', 70, 'Loaded cheese slice baked till bubbly.', p.pizzaSlice, ['popular']],
    ['Corn Cheese Slice', 80, 'Sweet corn & mozzarella on a crisp base.', p.pizzaBoard],
    ['Paneer Slice', 90, 'Paneer tikka, capsicum & onion with cheese.', p.vegFlatbread, ['chef']],
  ],
  burger: [
    ['Aloo Tikki Burger', 60, 'Crispy aloo tikki, onion, tomato & mayo.', p.burgerClassic, ['popular']],
    ['Veg Burger', 60, 'Mixed veg patty with fresh lettuce & sauce.', p.burgerTall],
    ['Cheese Burger', 80, 'Veg patty with a melting cheese slice.', p.burgerCheesy, ['popular']],
    ['Paneer Burger', 100, 'Crumb-fried paneer, spicy mayo & lettuce.', p.burgerCrispy, ['chef']],
    ['Double Cheese Burger', 110, 'Two patties, double cheese, double happiness.', p.burgerDouble, ['chef', 'popular']],
  ],
  fries: [
    ['Salted Fries', 70, 'Golden, crisp and perfectly salted.', p.friesBasket],
    ['Masala Fries', 80, 'Tossed in our house chaat masala.', p.friesMasala],
    ['Peri Peri Fries', 90, 'Fiery peri peri seasoning — addictive.', p.friesNewspaper, ['popular']],
    ['Cheese Fries', 110, 'Smothered in warm cheese sauce.', p.friesTray, ['chef']],
  ],
  coffee: [
    ['Hot Coffee', 30, 'Freshly brewed, frothy and comforting.', p.cappuccino],
    ['Cold Coffee', 60, 'Thick, chilled and creamy — a campus classic.', p.icedCoffee, ['popular']],
    ['Cold Coffee with Ice Cream', 80, 'Cold coffee topped with a vanilla scoop.', p.icedLatte, ['popular']],
    ['Chocolate Cold Coffee', 80, 'Rich chocolate meets chilled coffee.', p.oreoShake, ['chef']],
    ['Hazelnut Cold Coffee', 90, 'Nutty hazelnut syrup, extra creamy.', p.coldCoffeeCup],
  ],
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const menu = Object.entries(raw).flatMap(([category, items]) =>
  items.map(([name, price, description, image, tags = []]) => ({
    id: `${category}-${slug(name)}`,
    name,
    price,
    description,
    image,
    category,
    veg: true,
    popular: tags.includes('popular'),
    chef: tags.includes('chef'),
  })),
)

export const extras = [{ name: 'Extra Cheese', price: 30 }]

export const findItem = (name) => menu.find((m) => m.name === name)
