import { useTranslations } from 'next-intl';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <div className="flex gap-4">
        <Button>{t('clickMe')}</Button>
        <ModeToggle />
        <LanguageSwitcher />
      </div>
    </main>
  );
}

