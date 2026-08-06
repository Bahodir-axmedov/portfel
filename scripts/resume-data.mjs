/** Content for the generated ATS resumes (UZ / RU / EN). */

export const contact = {
	name: "Bahodir Axmedov",
	email: "Axmedovbahodir1122@gmail.com",
	phone: "+998 70 122 50 52",
	telegram: "@Th0masc",
	github: "github.com/Bahodir-axmedov",
	linkedin: "linkedin.com/in/bahodir-axmedov-a52911342",
	site: "bahodir.dev",
}

const skills = {
	uz: [
		["Dasturlash tillari", "Python, JavaScript, TypeScript, PHP, C++, SQL"],
		["Backend", "FastAPI, aiogram, Node.js, REST API, Webhooks"],
		["Frontend", "React, Next.js, TailwindCSS, HTML5, CSS3"],
		["Ma'lumotlar bazasi", "PostgreSQL, SQLite, MS SQL Server, Prisma ORM"],
		["BI va tahlil", "Power BI, DAX, MS SQL Server, Excel"],
		["DevOps va vositalar", "Git, GitHub, Docker, Railway, Linux"],
		["Tarmoq", "Cisco (routing, switching, VLAN)"],
	],
	ru: [
		["Языки программирования", "Python, JavaScript, TypeScript, PHP, C++, SQL"],
		["Backend", "FastAPI, aiogram, Node.js, REST API, Webhooks"],
		["Frontend", "React, Next.js, TailwindCSS, HTML5, CSS3"],
		["Базы данных", "PostgreSQL, SQLite, MS SQL Server, Prisma ORM"],
		["BI и аналитика", "Power BI, DAX, MS SQL Server, Excel"],
		["DevOps и инструменты", "Git, GitHub, Docker, Railway, Linux"],
		["Сети", "Cisco (routing, switching, VLAN)"],
	],
	en: [
		["Programming languages", "Python, JavaScript, TypeScript, PHP, C++, SQL"],
		["Backend", "FastAPI, aiogram, Node.js, REST API, Webhooks"],
		["Frontend", "React, Next.js, TailwindCSS, HTML5, CSS3"],
		["Databases", "PostgreSQL, SQLite, MS SQL Server, Prisma ORM"],
		["BI & analytics", "Power BI, DAX, MS SQL Server, Excel"],
		["DevOps & tooling", "Git, GitHub, Docker, Railway, Linux"],
		["Networking", "Cisco (routing, switching, VLAN)"],
	],
}

export const resumes = {
	uz: {
		lang: "uz",
		title: "Software Developer",
		labels: {
			summary: "Qisqacha ma'lumot",
			experience: "Ish tajribasi",
			projects: "Loyihalar",
			skills: "Ko'nikmalar",
			education: "Ta'lim",
			languages: "Tillar",
		},
		summary:
			"2020-yildan buyon dasturlash bilan shug'ullanuvchi Software Developer. Telegram botlar, web ilovalar, avtomatlashtirish tizimlari va sun'iy intellekt integratsiyalarini ishlab chiqishga ixtisoslashgan. Business Intelligence yo'nalishida Power BI va MS SQL Server bilan amaliy tajribaga ega. Toza arxitektura, xavfsizlik va unumdorlikka alohida e'tibor beradi.",
		experience: [
			{
				role: "Business Intelligence (BI) Developer",
				company: "Maab Innovation",
				period: "2025 — hozirgacha",
				bullets: [
					"Power BI'da interaktiv dashboardlar va hisobotlar ishlab chiqish",
					"MS SQL Server'da so'rovlar va ma'lumot modellarini optimallashtirish",
					"DAX yordamida biznes ko'rsatkichlari va KPI hisob-kitoblarini yaratish",
					"Hisobot tayyorlash jarayonlarini avtomatlashtirish",
				],
			},
			{
				role: "Freelance Software Developer",
				company: "Mustaqil loyihalar",
				period: "2022 — hozirgacha",
				bullets: [
					"Buyurtmachilar uchun Telegram botlar va avtomatlashtirish yechimlari",
					"REST API integratsiyalari va ma'lumotlar bazasi arxitekturasi",
					"Loyihalarni Railway va Docker orqali production'ga chiqarish",
				],
			},
		],
		projects: [
			{
				name: "Energy Invest",
				period: "2025 — 2026",
				text: "Investitsiya loyihalarini boshqarish uchun Telegram Mini App platformasi: foydalanuvchi kabineti, admin panel, statistika va avtomatlashtirilgan xizmat. Stack: Python, FastAPI, aiogram, SQLite, Railway.",
			},
			{
				name: "Bunker Bot",
				period: "2026",
				text: "1000+ foydalanuvchiga ega multiplayer o'yin boti: rollarni avtomatik taqsimlash, ovoz berish tizimi, admin panel va o'yin statistikasi. Stack: Python, aiogram 3, SQLite, Railway.",
			},
			{
				name: "BondTrader",
				period: "2026",
				text: "Obligatsiyalar bo'yicha analitika va savdo yordamchisi (demo versiya). Stack: Python, FastAPI, PostgreSQL, Next.js.",
			},
		],
		skills: skills.uz,
		education: [
			{
				school: "Toshkent davlat iqtisodiyot universiteti",
				degree: "Bakalavr — Raqamli iqtisodiyot (Sun'iy intellekt)",
				period: "2024 — 2028",
			},
		],
		languages: [
			"O'zbek — ona tili",
			"Rus — yuqori daraja",
			"Ingliz — yuqori daraja",
		],
	},

	ru: {
		lang: "ru",
		title: "Software Developer",
		labels: {
			summary: "О себе",
			experience: "Опыт работы",
			projects: "Проекты",
			skills: "Навыки",
			education: "Образование",
			languages: "Языки",
		},
		summary:
			"Software Developer с опытом программирования с 2020 года. Специализируюсь на разработке Telegram-ботов, веб-приложений, систем автоматизации и интеграций с ИИ. Имею практический опыт в Business Intelligence: Power BI и MS SQL Server. Уделяю особое внимание чистой архитектуре, безопасности и производительности.",
		experience: [
			{
				role: "Business Intelligence (BI) Developer",
				company: "Maab Innovation",
				period: "2025 — настоящее время",
				bullets: [
					"Разработка интерактивных дашбордов и отчётов в Power BI",
					"Оптимизация запросов и моделей данных в MS SQL Server",
					"Расчёт бизнес-метрик и KPI с помощью DAX",
					"Автоматизация процессов подготовки отчётности",
				],
			},
			{
				role: "Freelance Software Developer",
				company: "Собственные проекты",
				period: "2022 — настоящее время",
				bullets: [
					"Разработка Telegram-ботов и решений автоматизации для клиентов",
					"Проектирование REST API и архитектуры баз данных",
					"Развёртывание проектов в production через Railway и Docker",
				],
			},
		],
		projects: [
			{
				name: "Energy Invest",
				period: "2025 — 2026",
				text: "Платформа Telegram Mini App для управления инвестиционными проектами: личный кабинет, админ-панель, статистика. Stack: Python, FastAPI, aiogram, SQLite, Railway.",
			},
			{
				name: "Bunker Bot",
				period: "2026",
				text: "Мультиплеерный игровой бот с 1000+ пользователями: автораспределение ролей, голосование, админ-панель. Stack: Python, aiogram 3, SQLite, Railway.",
			},
			{
				name: "BondTrader",
				period: "2026",
				text: "Аналитический помощник по облигациям (демо-версия). Stack: Python, FastAPI, PostgreSQL, Next.js.",
			},
		],
		skills: skills.ru,
		education: [
			{
				school: "Ташкентский государственный экономический университет",
				degree: "Бакалавр — Цифровая экономика (Искусственный интеллект)",
				period: "2024 — 2028",
			},
		],
		languages: [
			"Узбекский — родной",
			"Русский — продвинутый",
			"Английский — продвинутый",
		],
	},

	en: {
		lang: "en",
		title: "Software Developer",
		labels: {
			summary: "Summary",
			experience: "Experience",
			projects: "Projects",
			skills: "Skills",
			education: "Education",
			languages: "Languages",
		},
		summary:
			"Software Developer coding since 2020, specialising in Telegram bots, web applications, automation systems and AI integrations. Hands-on Business Intelligence experience with Power BI and MS SQL Server. Focused on clean architecture, security and performance.",
		experience: [
			{
				role: "Business Intelligence (BI) Developer",
				company: "Maab Innovation",
				period: "2025 — Present",
				bullets: [
					"Built interactive Power BI dashboards and reports for business stakeholders",
					"Optimised MS SQL Server queries, views and data models",
					"Implemented business metrics and KPI calculations with DAX",
					"Automated recurring reporting workflows and reduced manual effort",
				],
			},
			{
				role: "Freelance Software Developer",
				company: "Independent projects",
				period: "2022 — Present",
				bullets: [
					"Delivered Telegram bots and automation solutions for clients",
					"Designed REST API integrations and relational database schemas",
					"Shipped projects to production with Railway and Docker",
				],
			},
		],
		projects: [
			{
				name: "Energy Invest",
				period: "2025 — 2026",
				text: "Telegram Mini App platform for managing investment projects: user cabinet, admin panel, analytics and automated customer service. Stack: Python, FastAPI, aiogram, SQLite, Railway.",
			},
			{
				name: "Bunker Bot",
				period: "2026",
				text: "Multiplayer game bot with 1000+ users: automatic role dealing, daily voting system, admin panel and match statistics. Stack: Python, aiogram 3, SQLite, Railway.",
			},
			{
				name: "BondTrader",
				period: "2026",
				text: "Bond analytics and trading assistant (demo release). Stack: Python, FastAPI, PostgreSQL, Next.js.",
			},
		],
		skills: skills.en,
		education: [
			{
				school: "Tashkent State University of Economics",
				degree: "BSc — Digital Economy (Artificial Intelligence)",
				period: "2024 — 2028",
			},
		],
		languages: [
			"Uzbek — native",
			"Russian — advanced",
			"English — advanced",
		],
	},
}
