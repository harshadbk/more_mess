import { Quote } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FaGoogle } from 'react-icons/fa6'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import { reviews as sampleReviews } from '../../data/content'
import { reviewApi } from '../../services/api'
import SectionHeading from '../ui/SectionHeading'
import Stars from '../ui/Stars'
import ReviewForm from './ReviewForm'

const avatarColors = ['#FF6B00', '#2ECC71', '#FF8A00', '#6366F1', '#EC4899', '#222222']

const timeAgo = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`
}

function ReviewCard({ r, i }) {
  return (
    <article className="flex h-full flex-col rounded-[2rem] bg-white p-7 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <Quote size={40} className="fill-peach text-peach" />
        <FaGoogle size={20} className="text-ink/25" aria-label="Google review" />
      </div>
      <Stars value={r.rating} className="mt-4" />
      <p className="mt-4 flex-1 leading-relaxed text-ink/70">“{r.text}”</p>
      <div className="mt-6 flex items-center gap-3 border-t border-mist pt-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-white" style={{ background: avatarColors[i % avatarColors.length] }}>
          {r.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{r.name}</p>
          <p className="truncate text-sm text-ink/50">
            {r.role || 'Customer'} · {r.createdAt ? timeAgo(r.createdAt) : r.when}
          </p>
        </div>
      </div>
    </article>
  )
}

export default function Reviews() {
  const [live, setLive] = useState([])

  useEffect(() => {
    reviewApi
      .list()
      .then((d) => setLive(d.reviews ?? []))
      .catch(() => {}) // backend offline: sample reviews still show
  }, [])

  const all = [...live, ...sampleReviews]

  return (
    <section id="reviews" className="overflow-hidden py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="💬 Reviews" title="Loved by" highlight="thousands." />

        {/* Google-style rating summary */}
        <div className="mx-auto -mt-6 mb-12 flex w-fit flex-wrap items-center justify-center gap-4 rounded-full bg-white px-6 py-3 shadow-soft">
          <FaGoogle size={22} className="text-[#4285F4]" />
          <span className="font-display text-3xl font-extrabold">4.9</span>
          <Stars value={5} size={20} />
          <span className="text-sm text-ink/50">500+ Google reviews</span>
        </div>

        <Swiper
          className="reviews-swiper !px-1 !pb-14 !pt-2"
          modules={[Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1.08}
          loop={all.length > 3}
          grabCursor
          autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3, spaceBetween: 24 } }}
        >
          {all.map((r, i) => (
            <SwiperSlide key={r._id ?? r.name + i} className="!h-auto">
              <ReviewCard r={r} i={i} />
            </SwiperSlide>
          ))}
        </Swiper>

        <ReviewForm onCreated={(r) => setLive((prev) => [r, ...prev])} />
      </div>
    </section>
  )
}
