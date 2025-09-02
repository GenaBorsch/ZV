import Link from 'next/link';

export default function BattlepassSuccessPage() {
  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Оплата успешна</h1>
      <p className="text-muted-foreground mb-6">Ваш баттлпасс будет скоро доступен. Если он не появился мгновенно, обновите страницу через минуту.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/player/battlepasses" className="btn-primary">К моим баттлпассам</Link>
        <Link href="/player" className="btn-outline">В кабинет</Link>
      </div>
    </div>
  );
}


