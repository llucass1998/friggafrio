import { CompanyTeamMember } from "@/config/company-team"
import { User } from "lucide-react"

interface TeamMemberCardProps {
  member: CompanyTeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#bae6fd] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 motion-safe:hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      <div className="aspect-[3/4] w-full bg-[#f1f5f9] relative">
        {member.imageSrc ? (
          <img
            src={member.imageSrc}
            alt={member.imageAlt || `Foto de ${member.name}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#94a3b8] bg-gray-100">
            <User className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm font-medium">Foto pendente</span>
          </div>
        )}
      </div>
      <div className="p-4 md:p-6 text-center">
        <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">{member.name}</h3>
        <p className="text-sm text-gray-600 font-medium mb-2">{member.role}</p>
        {member.area && (
          <span className="inline-block bg-[#f0f9ff] text-[var(--color-primary)] text-xs font-semibold px-2 py-1 rounded">
            {member.area}
          </span>
        )}
      </div>
    </div>
  )
}
