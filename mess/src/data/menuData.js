/**
 * MENU DATA
 * ----------------------------------------------------------------------------
 * isSample: true  -> illustrative dish for design only, NOT a confirmed offering.
 * While any visible item is a sample, the menu shows a "sample menu" notice.
 *
 * To publish the real menu:
 *  1. Replace these items with real dishes and set isSample: false on each.
 *  2. Set menuMeta.updatedOn to the date you last changed the menu.
 *
 * Fields:
 *  category    'breakfast' | 'lunch' | 'dinner' | 'specials'
 *  diet        'veg' | 'non-veg'  (non-veg items are hidden when foodType is 'pure-veg')
 *  price       number in rupees, or null to hide the price
 *  servingTime optional text; if null, the meal timing from businessConfig is used
 *  image       path inside /public, e.g. '/images/dal-bowl.webp'
 */

export const menuMeta = {
  updatedOn: '', // e.g. '2026-10-17'
}

export const menuCategories = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'specials', label: 'Specials' },
]

export const menuItems = [
  {
    id: 'idli-vada-sambar',
    name: 'Idli, Vada & Sambar',
    description: 'Soft idlis and crisp medu vada served with hot sambar and chutneys.',
    category: 'breakfast',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/idli-vada-sambar.webp',
    imageAlt: 'Plate of idli and medu vada with a bowl of sambar and coconut chutney',
    isSample: true,
  },
  {
    id: 'masala-dosa',
    name: 'Masala Dosa',
    description: 'Golden dosa with potato bhaji, sambar and coconut chutney.',
    category: 'breakfast',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/masala-dosa.webp',
    imageAlt: 'Crisp masala dosa with small bowls of sambar and chutneys',
    isSample: true,
  },
  {
    id: 'chapati-thali',
    name: 'Chapati, Sabzi & Dal Thali',
    description: 'Fresh chapatis, a seasonal sabzi, dal, rice, pickle and salad.',
    category: 'lunch',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/thali-steel.webp',
    imageAlt: 'Steel thali with chapatis, vegetable sabzi, dal and pickle',
    isSample: true,
  },
  {
    id: 'maharashtrian-thali',
    name: 'Maharashtrian Thali',
    description: 'A full plate with chapati, two sabzis, varan, rice and accompaniments.',
    category: 'lunch',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/thali-chapati-dal.webp',
    imageAlt: 'Thali with chapatis, three bowls of dal and curry, rice and dry sabzi',
    isSample: true,
  },
  {
    id: 'dal-rice',
    name: 'Dal, Rice & Salad',
    description: 'Comforting tadka dal with steamed rice and a fresh salad.',
    category: 'dinner',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/dal-bowl.webp',
    imageAlt: 'Copper bowl of tadka dal garnished with coriander',
    isSample: true,
  },
  {
    id: 'paneer-rice',
    name: 'Paneer Curry & Rice',
    description: 'Mildly spiced paneer gravy served with steamed rice.',
    category: 'dinner',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/paneer-rice.webp',
    imageAlt: 'Paneer curry served over steamed rice on a white plate',
    isSample: true,
  },
  {
    id: 'pav-bhaji',
    name: 'Pav Bhaji',
    description: 'Buttery bhaji with soft pav, onion and lemon on the side.',
    category: 'specials',
    diet: 'veg',
    price: null,
    servingTime: null,
    image: '/images/pav-bhaji.webp',
    imageAlt: 'Bowl of pav bhaji topped with butter, surrounded by soft pav buns',
    isSample: true,
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    description: 'Fragrant rice layered with spiced chicken, served with raita.',
    category: 'specials',
    diet: 'non-veg',
    price: null,
    servingTime: null,
    image: '/images/chicken-biryani.webp',
    imageAlt: 'Plate of chicken biryani garnished with mint and fried onions',
    isSample: true,
  },
]
