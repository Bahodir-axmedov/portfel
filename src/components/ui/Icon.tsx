import {
	Activity,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	Atom,
	Award,
	BarChart3,
	Bot,
	Braces,
	BrainCircuit,
	Briefcase,
	Calendar,
	CalendarClock,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	CircleDot,
	Code2,
	Contact,
	Copy,
	Cpu,
	Database,
	Download,
	ExternalLink,
	Facebook,
	FileCode,
	FileText,
	FolderKanban,
	Gauge,
	Github,
	GitBranch,
	Globe,
	GraduationCap,
	Handshake,
	Hexagon,
	Image as ImageIcon,
	Instagram,
	Layers,
	LineChart,
	Linkedin,
	Link2,
	Mail,
	MapPin,
	Menu,
	MessageCircle,
	MessagesSquare,
	Milestone,
	Network,
	Phone,
	Play,
	QrCode,
	Quote,
	Rocket,
	Send,
	Server,
	ShieldCheck,
	Sparkles,
	Star,
	Terminal,
	Trophy,
	Users,
	Workflow,
	X,
	Youtube,
	Zap,
	type LucideIcon,
	type LucideProps,
} from "lucide-react"
import {
	SiDocker,
	SiFacebook,
	SiFastapi,
	SiGithub,
	SiInstagram,
	SiNextdotjs,
	SiPostgresql,
	SiPython,
	SiRailway,
	SiReact,
	SiSqlite,
	SiTailwindcss,
	SiTelegram,
	SiYoutube,
} from "react-icons/si"
import type { ComponentType } from "react"

/**
 * Explicit icon registry.
 *
 * Icons are stored in the database as plain strings ("Bot", "Database", ...),
 * so the admin can pick any of these names without touching code. Imports are
 * explicit rather than a wildcard so the bundle only ships what is used.
 */
export const iconRegistry = {
	Activity,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	Atom,
	Award,
	BarChart3,
	Bot,
	Braces,
	BrainCircuit,
	Briefcase,
	Calendar,
	CalendarClock,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	CircleDot,
	Code2,
	Contact,
	Copy,
	Cpu,
	Database,
	Download,
	ExternalLink,
	Facebook,
	FileCode,
	FileText,
	FolderKanban,
	Gauge,
	Github,
	GitBranch,
	Globe,
	GraduationCap,
	Handshake,
	Hexagon,
	Image: ImageIcon,
	Instagram,
	Layers,
	LineChart,
	Linkedin,
	Link2,
	Mail,
	MapPin,
	Menu,
	MessageCircle,
	MessagesSquare,
	Milestone,
	Network,
	Phone,
	Play,
	QrCode,
	Quote,
	Rocket,
	Send,
	Server,
	ShieldCheck,
	Sparkles,
	Star,
	Terminal,
	Telegram: Send,
	Trophy,
	Users,
	Workflow,
	X,
	Youtube,
	Zap,
} satisfies Record<string, LucideIcon>

type BrandIcon = ComponentType<{
	size?: string | number
	className?: string
	color?: string
	title?: string
}>

/**
 * Brand (technology) logos. Stored the same way as lucide names, e.g. the
 * `Technology.icon` column holds "SiPython". Keeping them in a separate map
 * lets `Icon` stay a single component for the whole app.
 */
export const brandRegistry: Record<string, BrandIcon> = {
	SiDocker,
	SiFacebook,
	SiFastapi,
	SiGithub,
	SiInstagram,
	SiNextdotjs,
	SiPostgresql,
	SiPython,
	SiRailway,
	SiReact,
	SiSqlite,
	SiTailwindcss,
	SiTelegram,
	SiYoutube,
}

export type IconName = keyof typeof iconRegistry

export const iconNames = [
	...Object.keys(iconRegistry),
	...Object.keys(brandRegistry),
] as string[]

export function getIcon(name?: string | null): LucideIcon {
	if (!name) return Sparkles
	return (iconRegistry as Record<string, LucideIcon>)[name] ?? Sparkles
}

export type IconProps = LucideProps & { name?: string | null }

/** Renders a database-driven icon by name, falling back to a neutral glyph. */
export function Icon({ name, ...props }: IconProps) {
	const Brand = name ? brandRegistry[name] : undefined

	if (Brand) {
		return (
			<Brand
				size={props.size ?? 24}
				className={props.className}
				color={typeof props.color === "string" ? props.color : undefined}
			/>
		)
	}

	const Component = getIcon(name)
	return <Component {...props} />
}
