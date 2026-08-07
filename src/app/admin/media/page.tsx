import { AdminShell } from "@/components/admin/AdminShell"
import { MediaLibrary } from "@/components/admin/MediaLibrary"
import { MAX_UPLOAD_MB } from "@/constants"

export const dynamic = "force-dynamic"

export default function AdminMediaPage() {
	return (
		<AdminShell
			title="Media kutubxona"
			description="Yuklangan rasm, video va hujjatlarni boshqarish"
		>
			{/* The real limit is resolved on the server so the hint the admin sees
			    always matches what /api/upload actually enforces. */}
			<MediaLibrary maxUploadMb={MAX_UPLOAD_MB} />
		</AdminShell>
	)
}
