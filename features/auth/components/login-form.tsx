'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { LocaleLink } from '@/components/locale-link';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button">
                  <Image
                    src="/google-icon.svg"
                    alt="Google icon"
                    width={20}
                    height={20}
                  />
                  {t('signInWithGoogle')}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {t('orContinueWith')}
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">{tCommon('email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">
                    {tCommon('password')}
                  </FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    {t('forgotPassword')}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
              </Field>
              <Field>
                <Button type="submit">{tCommon('login')}</Button>
                <FieldDescription className="text-center">
                  {t('noAccount')}{' '}
                  <LocaleLink href="/auth/register" className="text-primary">
                    {tCommon('register')}
                  </LocaleLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t('termsAndConditions')}
      </FieldDescription>
    </div>
  );
}
