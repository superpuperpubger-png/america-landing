import { useState, useEffect, useRef } from 'react'
import {
  Landmark,
  Menu,
  X,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  Globe,
  Award,
  Zap,
  ChevronDown,
  Star,
  Check,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  ArrowRight,
  Flag,
  Scale,
  Heart,
  MessageCircle,
  LogIn,
  UserPlus,
  LogOut,
  Send,
  MapPin,
  BookOpen,
  Phone,
  PhoneCall,
  Image as ImageIcon,
  Film,
  Trash2,
  Paperclip,
} from 'lucide-react'
import { io } from 'socket.io-client'
import * as api from './api'

// Animated counter hook
function useCountUp(end, duration, isVisible) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const startTime = Date.now()
    const step = (timestamp) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, isVisible])
  return count
}

// Format number with K, M
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toString()
}

export default function App() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingYearly, setBillingYearly] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const [email, setEmail] = useState('')

  // Auth & Chat
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register'
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatAttachment, setChatAttachment] = useState(null)
  const [chatUploadError, setChatUploadError] = useState('')
  const [chatUploading, setChatUploading] = useState(false)
  const [callNumber, setCallNumber] = useState('')
  const [traffic, setTraffic] = useState({ totalVisits: 0, onlineNow: 0 })
  const socketRef = useRef(null)
  const chatListRef = useRef(null)

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const howRef = useRef(null)
  const factsRef = useRef(null)
  const testimonialsRef = useRef(null)
  const pricingRef = useRef(null)
  const faqRef = useRef(null)

  const [heroVisible, setHeroVisible] = useState(true)
  const [featuresVisible, setFeaturesVisible] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const [howVisible, setHowVisible] = useState(false)
  const [factsVisible, setFactsVisible] = useState(false)
  const [testimonialsVisible, setTestimonialsVisible] = useState(false)
  const [pricingVisible, setPricingVisible] = useState(false)
  const [faqVisible, setFaqVisible] = useState(false)

  const stat1 = useCountUp(330, 2000, statsVisible)
  const stat2 = useCountUp(50, 2000, statsVisible)
  const stat3 = useCountUp(98, 2000, statsVisible)
  const stat4 = useCountUp(1, 2000, statsVisible)

  // Restore user from token
  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    api.getMe(token).then((u) => {
      setUser(u)
    }).catch(() => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    })
  }, [token])

  // Traffic: fetch and record visit
  useEffect(() => {
    api.recordVisit().then(() => {})
    const update = () => api.getTraffic().then(setTraffic)
    update()
    const t = setInterval(update, 15000)
    return () => clearInterval(t)
  }, [])

  // Socket.IO when user logged in and chat open
  useEffect(() => {
    if (!user || !chatOpen) return
    const socket = io(api.getSocketUrl(), { path: '/socket.io' })
    socketRef.current = socket
    socket.on('chat:history', (history) => setChatMessages(history || []))
    socket.on('chat:message', (msg) => setChatMessages((prev) => [...prev, msg]))
    socket.on('chat:cleared', () => setChatMessages([]))
    socket.emit('chat:history')
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, chatOpen])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatListRef.current) chatListRef.current.scrollTop = chatListRef.current.scrollHeight
  }, [chatMessages])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    const form = e.target
    const emailVal = form.email.value.trim()
    const passwordVal = form.password.value
    try {
      const data = await api.login(emailVal, passwordVal)
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      setAuthModal(null)
    } catch (err) {
      setAuthError(err.message || 'Ошибка входа')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    const form = e.target
    const usernameVal = form.username.value.trim()
    const emailVal = form.email.value.trim()
    const passwordVal = form.password.value
    if (passwordVal.length < 6) {
      setAuthError('Пароль не менее 6 символов')
      setAuthLoading(false)
      return
    }
    try {
      const data = await api.register(usernameVal, emailVal, passwordVal)
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      setAuthModal(null)
    } catch (err) {
      setAuthError(err.message || 'Ошибка регистрации')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setChatOpen(false)
    setChatAttachment(null)
    setChatUploadError('')
    setCallNumber('')
  }

  const handleChatFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setChatAttachment(null)
      return
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setChatUploadError('Можно отправлять только фото и видео')
      setChatAttachment(null)
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setChatUploadError('Файл слишком большой (макс. 20 МБ)')
      setChatAttachment(null)
      return
    }
    setChatUploadError('')
    setChatAttachment(file)
  }

  const handleClearChat = () => {
    if (!socketRef.current) return
    const ok = window.confirm('Очистить чат для всех пользователей?')
    if (!ok) return
    socketRef.current.emit('chat:clear')
  }

  const handleCall = () => {
    const raw = callNumber.replace(/[^\d+]/g, '')
    if (!raw || raw.length < 5) return
    window.location.href = `tel:${raw}`
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!user || !socketRef.current) return

    const hasText = chatInput.trim().length > 0
    const hasFile = !!chatAttachment

    if (!hasText && !hasFile) return

    try {
      setChatUploadError('')
      if (hasFile) {
        setChatUploading(true)
        const sent = await api.uploadChatFile({
          file: chatAttachment,
          userId: user.id,
          username: user.username,
          text: chatInput,
        })
        // Сообщение придёт через socket.io, но на случай задержек можно оптимистично добавить
        setChatMessages((prev) => [...prev, sent])
        setChatAttachment(null)
        setChatInput('')
      } else if (hasText) {
        socketRef.current.emit('chat:message', {
          user: { id: user.id, username: user.username },
          text: chatInput,
          type: 'text',
        })
        setChatInput('')
      }
    } catch (err) {
      setChatUploadError(err.message || 'Ошибка отправки файла')
    } finally {
      setChatUploading(false)
    }
  }

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === featuresRef.current) setFeaturesVisible(e.isIntersecting)
          if (e.target === statsRef.current) setStatsVisible(e.isIntersecting)
          if (e.target === howRef.current) setHowVisible(e.isIntersecting)
          if (e.target === factsRef.current) setFactsVisible(e.isIntersecting)
          if (e.target === testimonialsRef.current) setTestimonialsVisible(e.isIntersecting)
          if (e.target === pricingRef.current) setPricingVisible(e.isIntersecting)
          if (e.target === faqRef.current) setFaqVisible(e.isIntersecting)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )
    if (featuresRef.current) observer.observe(featuresRef.current)
    if (statsRef.current) observer.observe(statsRef.current)
    if (howRef.current) observer.observe(howRef.current)
    if (factsRef.current) observer.observe(factsRef.current)
    if (testimonialsRef.current) observer.observe(testimonialsRef.current)
    if (pricingRef.current) observer.observe(pricingRef.current)
    if (faqRef.current) observer.observe(faqRef.current)
    return () => observer.disconnect()
  }, [])

  const navLinks = [
    { label: 'Преимущества', href: '#features' },
    { label: 'Цифры', href: '#stats' },
    { label: 'Факты', href: '#facts' },
    { label: 'Отзывы', href: '#testimonials' },
    { label: 'Тарифы', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Чат', href: '#chat' },
  ]

  const features = [
    { icon: Shield, title: 'Свобода и демократия', desc: 'Конституция 1787 года и Билль о правах заложили систему сдержек и противовесов. Независимый суд, свободная пресса и регулярные выборы гарантируют права каждого гражданина уже более двух столетий.' },
    { icon: TrendingUp, title: 'Крупнейшая экономика', desc: 'ВВП США превышает $25 трлн — около четверти мирового. Нью-Йоркская фондовая биржа, доллар как резервная валюта и мощный потребительский рынок создают уникальные возможности для бизнеса и карьеры.' },
    { icon: Globe, title: 'Культурное разнообразие', desc: 'США — страна иммигрантов: десятки этнических групп и культур создают мозаику идей и традиций. Это укрепляет инновации, толерантность и глобальные связи.' },
    { icon: Award, title: 'Лучшие университеты', desc: 'MIT, Stanford, Harvard, Yale, Princeton — в топ-20 мировых рейтингов стабильно входят американские вузы. Исследовательские гранты и уровень науки привлекают студентов и учёных со всего мира.' },
    { icon: Zap, title: 'Технологический лидер', desc: 'Кремниевая долина, Boston Route 128, Austin, Seattle — центры разработки софта, биотеха и ИИ. Apple, Google, Microsoft, Tesla и тысячи стартапов задают тренды для всей планеты.' },
    { icon: Heart, title: 'Мечта и возможности', desc: 'Культура «American Dream»: упорный труд и идеи могут привести к успеху независимо от происхождения. Социальная мобильность, предпринимательство и вера в возможности остаются ядром национальной идентичности.' },
  ]

  const steps = [
    { num: 1, icon: Flag, title: 'Основание ценностей', text: 'Декларация независимости и Конституция заложили принципы свободы и равенства.' },
    { num: 2, icon: Scale, title: 'Система и институты', text: 'Независимые суды, свободная пресса и выборная власть укрепляют демократию.' },
    { num: 3, icon: Sparkles, title: 'Результат для мира', text: 'Лидер в науке, культуре и глобальных инициативах, притягивающий таланты.' },
  ]

  const testimonials = [
    { name: 'Алексей К.', role: 'Предприниматель', quote: 'Переехал 5 лет назад. Нигде больше не видел такого сочетания возможностей и честных правил игры.', rating: 5, initials: 'АК', color: 'from-blue-500 to-cyan-500' },
    { name: 'Мария С.', role: 'Исследователь', quote: 'Лаборатории и гранты здесь на другом уровне. Реально можно менять мир своими проектами.', rating: 5, initials: 'МС', color: 'from-amber-500 to-orange-500' },
    { name: 'Дмитрий В.', role: 'Инженер', quote: 'Карьерный рост ограничен только твоей энергией. Компании ценят результат, а не связи.', rating: 5, initials: 'ДВ', color: 'from-emerald-500 to-teal-500' },
  ]

  const plans = [
    { name: 'Базовый', priceMonth: 0, priceYear: 0, desc: 'Знакомство с возможностями', popular: false, features: ['Доступ к материалам', 'Еженедельный дайджест', 'Сообщество в чате'] },
    { name: 'Про', priceMonth: 29, priceYear: 290, desc: 'Для серьёзных целей', popular: true, features: ['Всё из Базового', 'Персональный план', 'Консультации экспертов', 'Приоритетная поддержка'] },
    { name: 'Энтерпрайз', priceMonth: 99, priceYear: 990, desc: 'Для команд и организаций', popular: false, features: ['Всё из Про', 'Корпоративное обучение', 'SLA 99.9%', 'Выделенный менеджер'] },
  ]

  const faqs = [
    { q: 'Почему Америка считается лидером инноваций?', a: 'Сочетание сильного образования, венчурного капитала, культуры риска и защиты интеллектуальной собственности создаёт уникальную экосистему для стартапов и исследований.' },
    { q: 'Как устроена американская демократия?', a: 'Федерализм, разделение властей, двухпалатный конгресс и независимый Верховный суд обеспечивают сдержки и противовесы уже более 200 лет.' },
    { q: 'Что даёт сильная экономика США?', a: 'Крупнейший потребительский рынок, резервная валюта (доллар), приток инвестиций и высокие стандарты жизни для миллионов людей.' },
    { q: 'Как образование связано с успехом страны?', a: 'Топовые университеты привлекают таланты со всего мира, а исследовательские гранты двигают науку вперёд, создавая новые отрасли.' },
    { q: 'Почему культура «мечты» важна?', a: 'Установка на то, что усилия ведут к результату, мотивирует предпринимательство и социальную мобильность, что укрепляет общество.' },
    { q: 'Как США влияют на глобальные стандарты?', a: 'Через технологии, медиа, науку и дипломатию американские ценности и стандарты распространяются, задавая тренды в мире.' },
  ]

  const footerLinks = {
    Продукт: ['Возможности', 'Тарифы', 'Кейсы', 'Интеграции'],
    Ресурсы: ['Блог', 'Гайды', 'Подкасты', 'Вебинары'],
    Компания: ['О нас', 'Карьера', 'Партнёры', 'Контакты'],
    Правовая: ['Политика конфиденциальности', 'Условия использования', 'Cookie'],
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          33% { transform: translate(40px, -40px) scale(1.1); opacity: 0.5; }
          66% { transform: translate(-30px, 30px) scale(0.9); opacity: 0.35; }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-50px, -20px) scale(1.15); opacity: 0.45; }
        }
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(30px, 40px); opacity: 0.4; }
        }
        @keyframes sectionReveal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fade-in-up-1 { animation: fadeInUp 0.8s ease-out 0.1s forwards; opacity: 0; }
        .animate-fade-in-up-2 { animation: fadeInUp 0.8s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-in-up-3 { animation: fadeInUp 0.8s ease-out 0.3s forwards; opacity: 0; }
        .animate-fade-in-up-4 { animation: fadeInUp 0.8s ease-out 0.4s forwards; opacity: 0; }
        .blob-1 { animation: blobFloat1 12s ease-in-out infinite; }
        .blob-2 { animation: blobFloat2 10s ease-in-out infinite; }
        .blob-3 { animation: blobFloat3 14s ease-in-out infinite; }
        .section-reveal { animation: sectionReveal 0.7s ease-out forwards; }
        .accordion-content { overflow: hidden; transition: max-height 0.4s ease; }
        .features-grid.visible .feature-card { animation: fadeInUp 0.6s ease-out forwards; }
        .features-grid.visible .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .features-grid.visible .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .features-grid.visible .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .features-grid.visible .feature-card:nth-child(4) { animation-delay: 0.4s; }
        .features-grid.visible .feature-card:nth-child(5) { animation-delay: 0.5s; }
        .features-grid.visible .feature-card:nth-child(6) { animation-delay: 0.6s; }
        .feature-card { opacity: 0; }
        .chevron-open { transform: rotate(180deg); transition: transform 0.25s ease; }
        .chevron-closed { transform: rotate(0deg); transition: transform 0.25s ease; }
        .retro-phone {
          border-radius: 32px;
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.06),
            0 18px 40px rgba(0,0,0,0.6);
          background: radial-gradient(circle at 20% 0, #1f2937 0, #020617 55%, #000 100%);
        }
        .retro-phone-inner {
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.98));
        }
        .retro-phone-speaker {
          width: 80px;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #020617, #64748b, #020617);
        }
        .retro-phone-camera {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, #f1f5f9, #020617);
        }
        .retro-phone-home {
          width: 70px;
          height: 22px;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 0, #e5e7eb, #020617);
        }
      `}</style>

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled ? 'bg-[#08080f]/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#" className="flex items-center gap-2 text-white font-bold text-lg">
              <Landmark className="w-8 h-8 text-blue-400" />
              <span className="hidden sm:inline bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">America</span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.label === 'Чат' ? (
                  <button key={link.href} onClick={() => setChatOpen(true)} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    {link.label}
                  </button>
                ) : (
                  <a key={link.href} href={link.href} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    {link.label}
                  </a>
                )
              )}
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Онлайн: {traffic.onlineNow} · Визитов: {traffic.totalVisits}
              </span>
              <button
                onClick={() => { setChatOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Чат</span>
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-slate-400 text-sm truncate max-w-[100px]">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setAuthModal('login'); setAuthError(''); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/10 transition">
                    <LogIn className="w-4 h-4" /> Войти
                  </button>
                  <button onClick={() => { setAuthModal('register'); setAuthError(''); }} className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-red-500 text-white hover:scale-105 transition">
                    <UserPlus className="w-4 h-4" /> Регистрация
                  </button>
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                aria-label="Меню"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="px-4 pb-6 pt-2 flex flex-col gap-2 border-t border-white/10 bg-[#08080f]/95 backdrop-blur-xl">
            <div className="py-2 text-xs text-slate-500">Онлайн: {traffic.onlineNow} · Визитов: {traffic.totalVisits}</div>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => { setMobileMenuOpen(false); if (link.label === 'Чат') setChatOpen(true); }}
                className="py-3 px-4 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                {link.label}
              </a>
            ))}
            {user ? (
              <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="mt-2 py-3 px-4 rounded-xl border border-white/20 text-slate-300 font-medium">
                Выйти ({user.username})
              </button>
            ) : (
              <>
                <button onClick={() => { setMobileMenuOpen(false); setAuthModal('login'); }} className="mt-2 py-3 px-4 rounded-xl border border-white/20 text-slate-300 font-medium">Войти</button>
                <button onClick={() => { setMobileMenuOpen(false); setAuthModal('register'); }} className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-red-500 text-white font-semibold">Регистрация</button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Auth modals */}
      {authModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setAuthModal(null)}>
          <div className="bg-[#0f0f18] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{authModal === 'login' ? 'Вход' : 'Регистрация'}</h3>
              <button onClick={() => setAuthModal(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={authModal === 'login' ? handleLogin : handleRegister} className="p-6 space-y-4">
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              {authModal === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Имя</label>
                  <input name="username" type="text" required placeholder="Как к вам обращаться" className="w-full min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input name="email" type="email" required placeholder="email@example.com" className="w-full min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Пароль</label>
                <input name="password" type="password" required placeholder="••••••••" minLength={6} className="w-full min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={authLoading} className="w-full min-h-[44px] rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-red-500 text-white hover:opacity-90 disabled:opacity-50 transition">
                {authLoading ? 'Загрузка...' : authModal === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
              <p className="text-center text-slate-400 text-sm">
                {authModal === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <button type="button" onClick={() => { setAuthModal(authModal === 'login' ? 'register' : 'login'); setAuthError(''); }} className="text-blue-400 hover:underline">
                  {authModal === 'login' ? 'Регистрация' : 'Войти'}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-3 right-3 z-50 w-full sm:w-[380px] md:w-[400px] flex items-end justify-end">
          <div className="retro-phone w-full max-w-[360px] h-[560px] px-3 pt-3 pb-4">
            <div className="retro-phone-inner w-full h-full flex flex-col px-3 pt-3 pb-3">
              {/* Top hardware elements */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex items-center justify-between w-full px-2">
                  <div className="retro-phone-camera" />
                  <div className="flex items-center gap-1 text-[10px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online {traffic.onlineNow}</span>
                  </div>
                </div>
                <div className="retro-phone-speaker" />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 px-2 py-1">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[90px]">{user ? user.username : 'Гость'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 rounded-[2px] bg-lime-400" />
                    <span className="w-1 h-2.5 rounded-[2px] bg-lime-300" />
                    <span className="w-1 h-2 rounded-[2px] bg-lime-200" />
                  </div>
                </div>
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-[12px] font-semibold text-slate-100 uppercase tracking-wide">America Chat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Очистить чат"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat content or auth hint */}
              {user ? (
                <>
                  <div ref={chatListRef} className="flex-1 overflow-y-auto px-2 py-1 space-y-2 text-[13px]">
                    {chatMessages.length === 0 && (
                      <p className="text-slate-500 text-[11px] text-center py-4">
                        Пока сообщений нет. Напишите первым!
                      </p>
                    )}
                    {chatMessages.map((m) => {
                      const mine = m.userId === user.id
                      const isImage = m.type === 'image'
                      const isVideo = m.type === 'video'
                      const hasMedia = isImage || isVideo
                      const baseUrl = api.getSocketUrl().replace(/\/+$/, '')
                      const mediaUrl = m.fileUrl
                        ? (m.fileUrl.startsWith('http')
                          ? m.fileUrl
                          : `${baseUrl}${m.fileUrl}`)
                        : null
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 border text-[12px] ${
                              mine
                                ? 'bg-gradient-to-r from-blue-500/30 to-red-500/30 border-white/15 text-slate-50'
                                : 'bg-slate-900/70 border-white/10 text-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[10px] text-slate-300 truncate max-w-[100px]">
                                {m.username}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {m.time
                                  ? new Date(m.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                                  : ''}
                              </span>
                            </div>

                            {hasMedia && mediaUrl && (
                              <div className="mt-0.5 mb-0.5 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                {isImage && (
                                  <img
                                    src={mediaUrl}
                                    alt={m.fileName || 'image'}
                                    className="max-h-40 w-full object-cover"
                                  />
                                )}
                                {isVideo && (
                                  <video
                                    src={mediaUrl}
                                    controls
                                    className="max-h-40 w-full bg-black"
                                  />
                                )}
                                {m.fileName && (
                                  <div className="px-2 py-1 flex items-center gap-1 text-[10px] text-slate-300 bg-black/30">
                                    {isImage ? (
                                      <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                                    ) : (
                                      <Film className="w-3.5 h-3.5 text-amber-300" />
                                    )}
                                    <span className="truncate">{m.fileName}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {m.text && (
                              <p className="text-[12px] leading-snug break-words">
                                {m.text}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Dialer mini-panel */}
                  <div className="px-2 pb-1 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 flex items-center gap-1.5 rounded-xl bg-black/30 border border-white/10 px-2 py-1">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <input
                          value={callNumber}
                          onChange={(e) => setCallNumber(e.target.value)}
                          placeholder="+1 555 123 4567"
                          className="flex-1 bg-transparent outline-none border-none text-[11px] text-slate-100 placeholder:text-slate-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCall}
                        className="px-2 py-1 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-[11px] font-semibold text-white flex items-center gap-1 transition"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Call
                      </button>
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-500">
                      Звонок откроется через приложение телефона на вашем устройстве.
                    </p>
                  </div>

                  {/* Input row */}
                  <form onSubmit={sendMessage} className="px-2 pt-1 pb-1.5 border-t border-white/5">
                    {chatUploadError && (
                      <p className="text-[10px] text-red-400 mb-1">{chatUploadError}</p>
                    )}
                    <div className="flex items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <label className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer transition">
                          <Paperclip className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleChatFileChange}
                          />
                        </label>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        {chatAttachment && (
                          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 border border-dashed border-blue-500/40">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-200">
                              {chatAttachment.type.startsWith('image/') ? (
                                <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                              ) : (
                                <Film className="w-3.5 h-3.5 text-amber-300" />
                              )}
                              <span className="truncate max-w-[130px]">{chatAttachment.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setChatAttachment(null)}
                              className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
                              title="Убрать файл"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={chatAttachment ? 'Комментарий к файлу...' : 'Сообщение...'}
                            maxLength={1000}
                            className="flex-1 min-h-[38px] px-3 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={chatUploading}
                            className="min-h-[38px] px-3 rounded-xl bg-gradient-to-r from-blue-500 to-red-500 text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center transition text-[13px]"
                          >
                            {chatUploading ? '...' : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Home button */}
                  <div className="mt-1 flex items-center justify-center">
                    <div className="retro-phone-home" />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-[13px]">
                  <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-300 mb-3">
                    Войдите или зарегистрируйтесь, чтобы участвовать в чате.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setChatOpen(false); setAuthModal('login'); }}
                      className="px-4 py-2 rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 text-[13px]"
                    >
                      Войти
                    </button>
                    <button
                      onClick={() => { setChatOpen(false); setAuthModal('register'); }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-red-500 text-white font-semibold text-[13px]"
                    >
                      Регистрация
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="blob-1 absolute w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl -top-40 -left-40" />
            <div className="blob-2 absolute w-[400px] h-[400px] rounded-full bg-red-500/15 blur-3xl top-1/2 -right-20" />
            <div className="blob-3 absolute w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-3xl bottom-20 left-1/3" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight animate-fade-in-up">
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-red-400 bg-clip-text text-transparent">
                Америка
              </span>
              <br />
              <span className="text-white">и почему она лучшая страна</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto animate-fade-in-up-2">
              Свобода, возможности и мечта. Узнайте, почему США остаются лидером по инновациям, демократии и качеству жизни.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up-3">
              <a
                href="#features"
                className="min-h-[44px] inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-red-500 text-white hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200"
              >
                Узнать больше
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="#pricing"
                className="min-h-[44px] inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold border border-white/20 text-slate-300 hover:bg-white/5 hover:border-white/30 hover:text-white transition-all duration-200"
              >
                Выбрать план
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} className="py-24 px-4 sm:px-6">
          <div className={`max-w-6xl mx-auto ${featuresVisible ? 'section-reveal' : ''}`} style={{ opacity: featuresVisible ? 1 : 0 }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Почему выбирают Америку</h2>
              <p className="mt-4 text-slate-400 max-w-xl mx-auto">Ценности, институты и возможности, которые делают США уникальными.</p>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 features-grid ${featuresVisible ? 'visible' : ''}`}>
              {features.map((item) => (
                <div
                  key={item.title}
                  className="feature-card group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-red-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" ref={statsRef} className="py-24 px-4 sm:px-6 relative">
          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent top-0" />
          <div className={`max-w-5xl mx-auto ${statsVisible ? 'section-reveal' : ''}`} style={{ opacity: statsVisible ? 1 : 0 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{formatNum(stat1)}M+</div>
                <div className="mt-1 text-slate-400 text-sm">население</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stat2}%</div>
                <div className="mt-1 text-slate-400 text-sm">доля мирового ВВП</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stat3}%</div>
                <div className="mt-1 text-slate-400 text-sm">топ-100 университетов</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">#{stat4}</div>
                <div className="mt-1 text-slate-400 text-sm">экономика мира</div>
              </div>
            </div>
          </div>
        </section>

        {/* Facts — больше информации */}
        <section id="facts" ref={factsRef} className="py-24 px-4 sm:px-6">
          <div className={`max-w-6xl mx-auto ${factsVisible ? 'section-reveal' : ''}`} style={{ opacity: factsVisible ? 1 : 0 }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">История и ключевые факты</h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">Краткий обзор того, как формировались США и почему они остаются лидером.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-10 h-10 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">История и основание</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Декларация независимости (1776) провозгласила право на жизнь, свободу и стремление к счастью. Конституция (1787) создала федеративную республику с разделением властей. Гражданская война (1861–1865) упрочила единство нации и отмену рабства. В XX веке США стали арсеналом демократии в двух мировых войнах и лидером западного блока во время холодной войны. Сегодня страна остаётся одной из старейших непрерывных демократий в мире.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-10 h-10 text-red-400" />
                  <h3 className="text-xl font-semibold text-white">География и регионы</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  США — третья по площади страна (около 9,8 млн км²). 50 штатов и округ Колумбия: от Аляски и Гавайев до Нью-Йорка и Калифорнии. Разнообразие климата и ландшафтов — от тропиков до арктики, от прерий до мегаполисов. Крупнейшие агломерации: Нью-Йорк, Лос-Анджелес, Чикаго, Хьюстон, Сан-Франциско. Каждый регион вносит вклад в экономику, науку и культуру страны.
                </p>
              </div>
            </div>
            <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-red-500/10">
              <h3 className="text-lg font-semibold text-white mb-4">Почему США лидируют по инновациям</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 text-sm">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Сильная защита интеллектуальной собственности и контрактов</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Крупнейший венчурный рынок и доступ к капиталу для стартапов</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Привлечение талантов со всего мира (H-1B, исследовательские программы)</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Культура риска и поддержка предпринимательства</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Топовые университеты и тесная связь науки с бизнесом</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Большой внутренний рынок для тестирования и масштабирования продуктов</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" ref={howRef} className="py-24 px-4 sm:px-6">
          <div className={`max-w-5xl mx-auto ${howVisible ? 'section-reveal' : ''}`} style={{ opacity: howVisible ? 1 : 0 }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Как это устроено</h2>
              <p className="mt-4 text-slate-400 max-w-xl mx-auto">От ценностей к результату: путь американской модели.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
              {steps.map((step, i) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                  )}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25">
                    {step.num}
                  </div>
                  <div className="mt-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mx-auto">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-slate-400 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" ref={testimonialsRef} className="py-24 px-4 sm:px-6 overflow-hidden">
          <div className={`max-w-6xl mx-auto ${testimonialsVisible ? 'section-reveal' : ''}`} style={{ opacity: testimonialsVisible ? 1 : 0 }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Отзывы</h2>
              <p className="mt-4 text-slate-400">Что говорят те, кто знает Америку изнутри.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:scale-[1.02] hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-semibold text-sm`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-slate-400 text-sm">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" ref={pricingRef} className="py-24 px-4 sm:px-6">
          <div className={`max-w-5xl mx-auto ${pricingVisible ? 'section-reveal' : ''}`} style={{ opacity: pricingVisible ? 1 : 0 }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Тарифы</h2>
              <p className="mt-4 text-slate-400">Выберите план под свои цели.</p>
              <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
                <span className={`text-sm font-medium ${!billingYearly ? 'text-white' : 'text-slate-400'}`}>Месяц</span>
                <button
                  onClick={() => setBillingYearly(!billingYearly)}
                  className={`w-12 h-6 rounded-full transition-colors ${billingYearly ? 'bg-gradient-to-r from-blue-500 to-red-500' : 'bg-slate-600'}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${billingYearly ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className={`text-sm font-medium ${billingYearly ? 'text-white' : 'text-slate-400'}`}>Год</span>
                <span className="text-xs text-emerald-400 font-medium">−17%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 rounded-2xl border bg-white/5 backdrop-blur-sm transition-all duration-300 ${
                    plan.popular
                      ? 'border-blue-500/50 scale-105 md:scale-105 shadow-xl shadow-blue-500/20 hover:scale-[1.08] hover:shadow-2xl hover:shadow-blue-500/25'
                      : 'border-white/10 hover:scale-[1.03] hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-red-500 text-white">
                      Популярный
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-slate-400 text-sm">{plan.desc}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      ${billingYearly ? plan.priceYear : plan.priceMonth}
                    </span>
                    <span className="text-slate-400">/ {billingYearly ? 'год' : 'мес'}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#cta"
                    className={`mt-6 block w-full py-3 rounded-xl text-center font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-red-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25'
                        : 'border border-white/20 text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Выбрать
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" ref={faqRef} className="py-24 px-4 sm:px-6">
          <div className={`max-w-4xl mx-auto ${faqVisible ? 'section-reveal' : ''}`} style={{ opacity: faqVisible ? 1 : 0 }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Частые вопросы</h2>
              <p className="mt-4 text-slate-400">Ответы на популярные вопросы.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left text-white font-medium hover:bg-white/5 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 ${openFaq === i ? 'chevron-open' : 'chevron-closed'}`} />
                  </button>
                  <div className="accordion-content" style={{ maxHeight: openFaq === i ? 400 : 0 }}>
                    <p className="px-4 pb-4 text-slate-400 text-sm">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section id="cta" className="py-24 px-4 sm:px-6">
          <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 p-8 sm:p-12 md:p-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-red-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Готовы узнать больше?</h2>
              <p className="mt-4 text-blue-100 max-w-xl mx-auto">Подпишитесь на рассылку — только полезные материалы о возможностях и ценностях.</p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full min-h-[44px] pl-12 pr-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <button type="submit" className="min-h-[44px] px-6 py-3 rounded-xl font-semibold bg-white text-blue-600 hover:scale-105 hover:shadow-lg transition-all">
                  Подписаться
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
              <div className="max-w-xs">
                <a href="#" className="flex items-center gap-2 text-white font-bold text-lg">
                  <Landmark className="w-8 h-8 text-blue-400" />
                  America
                </a>
                <p className="mt-3 text-slate-400 text-sm">Почему Америка — лучшая страна. Ценности, возможности, факты.</p>
                <div className="mt-4 flex gap-4">
                  <a href="#" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Github"><Github className="w-5 h-5" /></a>
                  <a href="#" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                  <a href="#" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title}>
                    <h4 className="font-semibold text-white text-sm">{title}</h4>
                    <ul className="mt-3 space-y-2">
                      {links.map((link) => (
                        <li key={link}>
                          <a href="#" className="text-slate-400 hover:text-white text-sm transition">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
              © {new Date().getFullYear()} America. Все права защищены.
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
