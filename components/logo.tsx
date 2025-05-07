import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Image
        src="/images/protopanda-logo.png"
        alt="ProtoPanda Logo"
        width={200}
        height={80}
        className="h-auto"
        priority
      />
    </div>
  )
}
