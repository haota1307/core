"use client";

import { ComponentProps } from "react";
import { Link } from "@/i18n/routing";

/**
 * A wrapper around next-intl's Link component for type-safe, locale-aware navigation
 * This component automatically handles locale prefixes in URLs
 */
export function LocaleLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />;
}
