import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCreateProductReview, useProductReviews, useReviewEligibility, useUpdateProductReview } from "@/lib/hooks/use-product-reviews"
import type { ProductReview, ReviewFilter, ReviewSort } from "@/lib/data/product-reviews"

const STAR = String.fromCharCode(9733)
const EMPTY_STAR = String.fromCharCode(9734)
const CHECK = String.fromCharCode(10003)

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value))

const initialsFor = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join("") || "C"

function StarSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const displayed = hovered || value

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, current: number) => {
    const next = event.key === "ArrowRight" || event.key === "ArrowUp"
      ? Math.min(5, current + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? Math.max(1, current - 1)
        : event.key === "Home"
          ? 1
          : event.key === "End"
            ? 5
            : null
    if (next === null) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota do produto">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} de 5 estrelas`}
          onClick={() => onChange(star)}
          onKeyDown={(event) => handleKeyDown(event, star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`rounded-md px-0.5 text-3xl leading-none transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${star <= displayed ? "text-amber-500" : "text-slate-300"}`}
        >
          {star <= displayed ? STAR : EMPTY_STAR}
        </button>
      ))}
    </div>
  )
}

function StaticStars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="tracking-[0.14em] text-amber-500" aria-label={label}>
      {STAR.repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-slate-300">{EMPTY_STAR.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  )
}

function ReviewModal({ productId, productTitle, existingReview, onClose }: { productId: string; productTitle: string; existingReview?: { id: string; rating: number; title: string | null; body: string } | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || "")
  const [body, setBody] = useState(existingReview?.body || "")
  const [submitted, setSubmitted] = useState(false)
  const mutation = useCreateProductReview(productId)
  const updateMutation = useUpdateProductReview(productId)
  const activeMutation = existingReview ? updateMutation : mutation

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, input, textarea"))
        .filter((element) => !element.hasAttribute("disabled"))
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!rating || body.trim().length < 10 || activeMutation.isPending) return
    try {
      if (existingReview) {
        await updateMutation.mutateAsync({ reviewId: existingReview.id, rating, title: title.trim(), body: body.trim() })
      } else {
        await mutation.mutateAsync({ rating, title: title.trim(), body: body.trim() })
      }
      setSubmitted(true)
    } catch {
      // The mutation state renders the server error without closing the modal.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(7,27,54,0.6)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="review-modal-title" className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl border border-[var(--color-border)] bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Sua experiência importa</p>
            <h2 id="review-modal-title" className="mt-2 text-xl font-bold text-[var(--color-navy)]">{existingReview ? "Editar avaliação" : "Avaliar produto"}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{productTitle}</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-xl leading-none text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-navy)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">{String.fromCharCode(215)}</button>
          </div>
        </div>
        {submitted ? (
          <div className="px-5 py-12 text-center sm:px-7" role="status">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">{CHECK}</div>
            <h3 className="text-lg font-bold text-[var(--color-navy)]">Avaliação enviada</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">Obrigado por compartilhar sua experiência. Sua avaliação será analisada antes da publicação.</p>
            <Button className="mt-6" onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[var(--color-navy)]">Qual é a sua nota?</legend>
              <StarSelector value={rating} onChange={setRating} />
            </fieldset>
            <label className="block text-sm font-semibold text-[var(--color-navy)]">
              Título da avaliação
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ex.: Produto excelente" className="mt-2 min-h-11 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 font-normal text-[var(--color-navy)] outline-none transition-shadow placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-navy)]">
              Sua avaliação
              <textarea required minLength={10} maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Conte como foi sua experiência com este produto." className="mt-2 w-full resize-y rounded-lg border border-[var(--color-border)] px-3 py-2.5 font-normal leading-6 text-[var(--color-navy)] outline-none transition-shadow placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </label>
            <p className="rounded-lg bg-[var(--color-surface-soft)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)]">
              Avaliações elegíveis são verificadas pelo sistema antes da publicação.
            </p>
            {activeMutation.isError && <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">Não foi possível salvar sua avaliação. Tente novamente.</p>}
            <div className="flex justify-end border-t border-[var(--color-border)] pt-5"><Button type="submit" disabled={!rating || body.trim().length < 10} isLoading={activeMutation.isPending}>{existingReview ? "Salvar avaliação" : "Enviar avaliação"}</Button></div>
          </form>
        )}
      </div>
    </div>
  )
}

function ReviewSummary({ summary }: { summary: NonNullable<ReturnType<typeof useProductReviews>["data"]>["summary"] }) {
  const total = summary.total
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_12px_30px_rgba(8,59,102,0.08)]">
      <div className="border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface-soft)] to-white px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">A confiança de quem compra</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Notas e experiências reais de clientes FriggaFrio.</p>
      </div>
      <div className="grid gap-7 px-5 py-6 sm:px-6 md:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.4fr)] md:items-center">
        <div className="md:border-r md:border-[var(--color-border)] md:pr-7">
          <div className="flex items-end gap-2"><span className="text-5xl font-bold tracking-tight text-[var(--color-navy)]">{summary.average?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span><span className="pb-1 text-sm font-semibold text-[var(--color-text-muted)]">/ 5</span></div>
          <div className="mt-2 text-xl"><StaticStars rating={Math.round(summary.average || 0)} label="Média de 5 estrelas" /></div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Baseado em <strong className="text-[var(--color-navy)]">{total} avaliações</strong></p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span aria-hidden="true">{CHECK}</span> Compra verificada quando aplicável</div>
        </div>
        <div className="space-y-2.5" aria-label="Distribuição das avaliações">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[String(star)] || 0
            const width = total > 0 ? Math.round((count / total) * 100) : 0
            return <div key={star} className="grid grid-cols-[38px_minmax(0,1fr)_32px] items-center gap-3 text-sm"><span className="font-semibold text-[var(--color-navy)]">{star} {STAR}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${width}%` }} /></div><span className="text-right font-medium text-[var(--color-text-muted)]">{count}</span></div>
          })}
        </div>
      </div>
    </div>
  )
}

function ReviewControls({ sort, rating, verified, total, canWrite, onSort, onRating, onVerified, onWrite }: { sort: ReviewSort; rating: ReviewFilter; verified: boolean; total: number; canWrite: boolean; onSort: (value: ReviewSort) => void; onRating: (value: ReviewFilter) => void; onVerified: (value: boolean) => void; onWrite: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Ordenar por<select value={sort} onChange={(event) => onSort(event.target.value as ReviewSort)} className="mt-1.5 block min-h-11 w-full min-w-44 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"><option value="recent">Mais recentes</option><option value="oldest">Mais antigas</option><option value="rating_high">Maior nota</option><option value="rating_low">Menor nota</option></select></label>
          <label className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Filtrar por<select value={rating} onChange={(event) => onRating(event.target.value as ReviewFilter)} className="mt-1.5 block min-h-11 w-full min-w-44 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"><option value="all">Todas as avaliações</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} estrelas</option>)}</select></label>
          {total > 0 && <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-navy)]"><input type="checkbox" checked={verified} onChange={(event) => onVerified(event.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" /> Compra verificada</label>}
        </div>
        {canWrite && <Button onClick={onWrite} size="sm" className="w-full sm:w-auto">Escrever avaliação</Button>}
      </div>
    </div>
  )
}

function EligibilityCard({ eligible, onWrite }: { eligible: boolean; onWrite: () => void }) {
  return eligible ? (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-surface-soft)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]">Sua experiência ajuda outros clientes</p><h3 className="mt-1 text-lg font-bold text-[var(--color-navy)]">Conte sua experiência com este produto</h3><p className="mt-1 text-sm text-[var(--color-text-muted)]">Sua compra foi elegível para uma avaliação verificada.</p></div>
      <Button onClick={onWrite} className="shrink-0">Avaliar este produto</Button>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text-muted)]"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] font-bold text-[var(--color-primary)]">i</span><p>Você poderá avaliar este produto após uma compra elegível.</p></div>
  )
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="w-full rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_22px_rgba(8,59,102,0.06)] transition-shadow hover:shadow-[0_12px_28px_rgba(8,59,102,0.1)] sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-sm font-bold text-[var(--color-primary)]" aria-hidden="true">{initialsFor(review.author_name)}</div><div className="min-w-0"><p className="truncate font-bold text-[var(--color-navy)]">{review.author_name}</p><div className="mt-1 text-base"><StaticStars rating={review.rating} label={`${review.rating} de 5 estrelas`} /></div></div></div>
        <time dateTime={review.created_at} className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">{formatDate(review.created_at)}</time>
      </header>
      {review.verified_purchase && <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span aria-hidden="true">{CHECK}</span> Compra verificada</div>}
      {review.title && <h3 className="mt-4 text-base font-bold text-[var(--color-navy)]">{review.title}</h3>}
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--color-text-secondary)]">{review.body}</p>
    </article>
  )
}

export default function ProductReviews({ productId, productTitle }: { productId: string; productTitle: string }) {
  const { isAuthenticated } = useAuth()
  const [sort, setSort] = useState<ReviewSort>("recent")
  const [rating, setRating] = useState<ReviewFilter>("all")
  const [verified, setVerified] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const { data, isLoading, isError } = useProductReviews(productId, { sort, rating, verified, page })
  const eligibility = useReviewEligibility(productId, isAuthenticated)
  const total = data?.summary.total || 0

  useEffect(() => {
    if (!data) return
    setReviews((current) => page === 1 ? data.reviews : [...current, ...data.reviews.filter((review) => !current.some((item) => item.id === review.id))])
  }, [data, page])

  const resetFilters = (next: () => void) => {
    next()
    setPage(1)
    setReviews([])
  }

  const canWrite = eligibility.data?.eligible === true
  const ownReview = eligibility.data?.review || null
  const canEdit = Boolean(ownReview)
  const showEligibility = isAuthenticated && eligibility.data
  const openModal = () => setModalOpen(true)

  return (
    <section aria-labelledby="reviews-title" className="mt-14 border-t border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface-soft)]/45 to-transparent px-4 pb-6 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <header className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Experiência FriggaFrio</p><h2 id="reviews-title" className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-navy)] sm:text-3xl">Avaliações do produto</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Veja as opiniões de clientes que compraram este produto.</p></header>

        {isLoading && !data ? <div className="space-y-4" aria-busy="true"><div className="h-64 animate-pulse rounded-2xl bg-white/80" /><div className="h-28 animate-pulse rounded-2xl bg-white/80" /></div> : isError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700" role="alert">Não foi possível carregar as avaliações.</p> : total === 0 ? (
          <div data-testid="product-review-empty" className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[0_8px_22px_rgba(8,59,102,0.05)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-3xl text-[var(--color-primary)]" aria-hidden="true">{EMPTY_STAR}</div>
              <div className="min-w-0 flex-1"><h3 className="text-base font-bold text-[var(--color-navy)]">Este produto ainda não possui avaliações.</h3><p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Seja o primeiro a avaliar e compartilhe sua experiência.</p></div>
              {(canWrite || canEdit) && <Button variant="outline" onClick={openModal} className="shrink-0">{canEdit ? "Editar avaliação" : "Avaliar produto"}</Button>}
            </div>
            {!canWrite && !canEdit && <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">Você poderá avaliar este produto após uma compra elegível.</p>}
          </div>
        ) : (
          <>
            <ReviewSummary summary={data!.summary} />
            <ReviewControls sort={sort} rating={rating} verified={verified} total={total} canWrite={canWrite} onSort={(value) => resetFilters(() => setSort(value))} onRating={(value) => resetFilters(() => setRating(value))} onVerified={(value) => resetFilters(() => setVerified(value))} onWrite={openModal} />
            {showEligibility && <EligibilityCard eligible={canWrite} onWrite={openModal} />}
            {showEligibility && canEdit && <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm"><span className="text-[var(--color-text-muted)]">Você já enviou uma avaliação.</span><Button size="sm" variant="outline" onClick={openModal}>Editar avaliação</Button></div>}
            {!isAuthenticated && <EligibilityCard eligible={false} onWrite={openModal} />}
            {isLoading ? <div className="space-y-4" aria-busy="true"><div className="h-44 animate-pulse rounded-2xl bg-white" /><div className="h-44 animate-pulse rounded-2xl bg-white" /></div> : reviews.length ? <div className="flex flex-col gap-4">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : <p className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-text-muted)]">Nenhuma avaliação corresponde a estes filtros.</p>}
            {data && data.count > reviews.length && <div className="flex justify-center"><Button variant="outline" onClick={() => setPage((value) => value + 1)}>Ver mais avaliações</Button></div>}
          </>
        )}
      </div>
      {modalOpen && <ReviewModal productId={productId} productTitle={productTitle} existingReview={ownReview} onClose={() => setModalOpen(false)} />}
    </section>
  )
}
