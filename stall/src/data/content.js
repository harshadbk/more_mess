import { Leaf, Wallet, Zap, ChefHat, GraduationCap, ShieldCheck } from 'lucide-react'
import { photos as p } from './photos'

export const features = [
  { icon: Leaf, title: 'Fresh Ingredients', text: 'Veggies chopped every morning, bread delivered fresh daily.', tint: 'from-emerald-400 to-leaf' },
  { icon: Wallet, title: 'Affordable Prices', text: 'Premium taste that fits a student budget — starting at ₹30.', tint: 'from-brand-2 to-brand' },
  { icon: Zap, title: 'Fast Service', text: 'Hot, fresh orders ready in minutes — perfect between lectures.', tint: 'from-amber-300 to-cheese' },
  { icon: ChefHat, title: 'Made Fresh', text: 'Nothing pre-made. Every sandwich is built when you order.', tint: 'from-rose-400 to-tomato' },
  { icon: GraduationCap, title: 'Loved by Students', text: 'The go-to snack spot for thousands of hungry students.', tint: 'from-sky-400 to-indigo-500' },
  { icon: ShieldCheck, title: 'Hygienic Kitchen', text: 'Gloves, caps and a spotless counter — always.', tint: 'from-teal-400 to-emerald-500' },
]

export const specials = [
  { ribbon: 'Chef Recommendation', item: 'Tandoori Paneer Grill', image: p.panini, tint: 'from-brand to-tomato' },
  { ribbon: 'Student Favorite', item: 'Veg Cheese Grill Sandwich', image: p.grillTriangles, tint: 'from-sky-500 to-indigo-500' },
  { ribbon: 'Most Ordered', item: 'Cold Coffee', image: p.icedCoffee, tint: 'from-amber-500 to-brand-2' },
  { ribbon: 'Best Seller', item: 'Double Cheese Burger', image: p.burgerDouble, tint: 'from-rose-500 to-brand' },
  { ribbon: "Today's Special", item: 'Peri Peri Fries', image: p.friesNewspaper, tint: 'from-emerald-500 to-leaf' },
]

export const stats = [
  { end: 5000, suffix: '+', label: 'Happy Customers' },
  { end: 40, suffix: '+', label: 'Menu Items' },
  { end: 4.9, decimals: 1, suffix: '★', label: 'Average Rating' },
  { end: 5, suffix: '+', label: 'Years of Trust' },
]

// Sample testimonials — replace with real Google reviews.
export const reviews = [
  { name: 'Aditya Patil', role: 'Engineering Student', text: 'The veg cheese grill is unreal. Crispy outside, loaded inside, and still under ₹100. My daily post-lecture ritual!', rating: 5, when: '2 weeks ago' },
  { name: 'Sneha Kulkarni', role: 'Parent', text: 'I trust them for my kids’ evening snacks. Super clean counter and the staff always wear gloves. Cheese toast is a hit at home.', rating: 5, when: '1 month ago' },
  { name: 'Rohan Deshmukh', role: 'Software Engineer', text: 'Their cold coffee beats the big café chains — thick, creamy and half the price. Fast service even during lunch rush.', rating: 5, when: '3 weeks ago' },
  { name: 'Priya Shinde', role: 'MBA Student', text: 'Club sandwich + peri peri fries = perfect study-group combo. Love the student offers too!', rating: 5, when: '5 days ago' },
  { name: 'Vikram Joshi', role: 'Office Worker', text: 'Quick, hygienic and consistently tasty. The paneer grill is my go-to working lunch.', rating: 5, when: '2 months ago' },
  { name: 'Ananya More', role: 'College Student', text: 'Chocolate cold coffee is dangerously good. Friendly uncle at the counter always remembers my order 😄', rating: 5, when: '1 week ago' },
]

export const gallery = [
  { id: p.grillTriangles, alt: 'Golden grilled sandwich triangles', tag: 'Food', ratio: 1.25 },
  { id: p.cafeBright, alt: 'Bright, welcoming seating area', tag: 'Shop', ratio: 0.75 },
  { id: p.burgerTall, alt: 'Tall burger with fresh lettuce and tomato', tag: 'Food', ratio: 1 },
  { id: p.chefFlame, alt: 'Chef cooking over a live flame', tag: 'Preparation', ratio: 1.3 },
  { id: p.coffeeCheers, alt: 'Friends cheering with coffee cups', tag: 'Customers', ratio: 0.8 },
  { id: p.friesNewspaper, alt: 'Crispy fries in a basket', tag: 'Food', ratio: 1.2 },
  { id: p.friends, alt: 'Happy group of friends', tag: 'Customers', ratio: 0.7 },
  { id: p.icedCoffee, alt: 'Chilled cold coffee', tag: 'Food', ratio: 1.35 },
  { id: p.chefPlating, alt: 'Chef carefully plating food', tag: 'Preparation', ratio: 1 },
  { id: p.cafeCounter, alt: 'Coffee counter', tag: 'Shop', ratio: 1.2 },
  { id: p.panini, alt: 'Pressed veggie panini', tag: 'Food', ratio: 0.8 },
  { id: p.cafeCrowd, alt: 'Customers enjoying their food', tag: 'Customers', ratio: 1.1 },
]

export const timeline = [
  { year: '2020', title: 'A small cart, a big dream', text: 'Started with one sandwich grill and a handful of recipes near the college gate.' },
  { year: '2021', title: 'Students made us famous', text: 'Word spread on campus — the veg cheese grill became an instant legend.' },
  { year: '2023', title: 'Bigger menu, same love', text: 'Added burgers, fries and our now-iconic cold coffee.' },
  { year: '2025', title: '5000+ happy customers', text: 'From students to families and office teams — serving happiness daily.' },
]

export const faqs = [
  { q: 'Are all items vegetarian?', a: 'Yes! Our entire menu is 100% vegetarian, prepared in a clean, hygienic kitchen.' },
  { q: 'How do I order on WhatsApp?', a: 'Tap any “Order” button — WhatsApp opens with your item pre-filled. Just hit send and we’ll confirm your order and pickup time.' },
  { q: 'Do you offer student discounts?', a: 'Absolutely. Show your college ID for student combos, and don’t miss our Extra Cheese for just ₹30 offer.' },
  { q: 'Can I customise my sandwich?', a: 'Of course — less spicy, no onion, extra cheese, Jain preparation… just tell us when you order.' },
  { q: 'Do you take bulk / party orders?', a: 'Yes, we cater for birthdays, college events and office meetings. Call us a day in advance for large orders.' },
  { q: 'What payment methods do you accept?', a: 'Cash, UPI (GPay, PhonePe, Paytm) and all major cards.' },
]

export const offers = [
  { code: 'STUDENT30', title: 'Student Combo', text: 'Any Grill Sandwich + Cold Coffee', price: '₹149', was: '₹180', emoji: '🎓', tint: 'from-brand to-brand-2' },
  { code: 'WEEKEND', title: 'Weekend Feast', text: 'Burger + Fries + Cold Coffee every Sat & Sun', price: '₹199', was: '₹250', emoji: '🎉', tint: 'from-rose-500 to-brand' },
  { code: 'FESTIVE', title: 'Festival Special', text: 'Family pack: 4 Grills + 4 Coffees', price: '₹499', was: '₹640', emoji: '🪔', tint: 'from-amber-500 to-cheese' },
]

export const instagram = [p.grilledCheese, p.oreoShake, p.burgerFries, p.cheeseToastBlue, p.icedLatte, p.friesMasala]
